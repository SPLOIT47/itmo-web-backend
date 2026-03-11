import { Injectable, Logger } from "@nestjs/common";
import { db } from "../../db/db";
import { FeedRepository } from "../../feed/repository/feed.repository";
import { FeedSourceRepository } from "../../feed/repository/feed-source.repository";
import { InboxRepository } from "../../inbox/repository/inbox.repository";
import {
    ContentEvent,
    ContentEventType,
    PostCreatedPayload,
    PostDeletedPayload,
    PostUpdatedPayload,
} from "@app/contracts/kafka/content";
import configuration from "../../config/configuration";

@Injectable()
export class ApplyContentEventUseCase {
    private readonly log = new Logger(ApplyContentEventUseCase.name);

    constructor(
        private readonly inboxRepository: InboxRepository,
        private readonly feedRepository: FeedRepository,
        private readonly feedSourceRepository: FeedSourceRepository,
    ) {}

    async handle(event: ContentEvent): Promise<void> {
        await db.transaction(async (tx) => {
            if (await this.inboxRepository.exists(event.eventId, tx)) {
                return;
            }

            const payload = event.payload as
                | PostCreatedPayload
                | PostUpdatedPayload
                | PostDeletedPayload;

            const aggregateId = payload.postId;
            const newVersion = payload.version;
            const currentVersion =
                (await this.inboxRepository.getLastVersionForAggregate(
                    aggregateId,
                    tx,
                )) ?? 0;

            if (newVersion <= currentVersion) {
                await this.inboxRepository.save(
                    {
                        eventId: event.eventId,
                        aggregateId,
                        version: newVersion,
                        eventType: event.eventType,
                    },
                    tx,
                );
                this.log.debug(
                    `Ignoring stale content event=${event.eventId} type=${event.eventType}`,
                );
                return;
            }

            switch (event.eventType) {
                case ContentEventType.POST_CREATED:
                    await this.handlePostCreated(payload as PostCreatedPayload, tx);
                    break;
                case ContentEventType.POST_UPDATED:
                    await this.handlePostUpdated(payload as PostUpdatedPayload, tx);
                    break;
                case ContentEventType.POST_DELETED:
                    await this.handlePostDeleted(payload as PostDeletedPayload, tx);
                    break;
                default:
                    break;
            }

            await this.inboxRepository.save(
                {
                    eventId: event.eventId,
                    aggregateId,
                    version: newVersion,
                    eventType: event.eventType,
                },
                tx,
            );
        });
    }

    private async handlePostCreated(
        payload: PostCreatedPayload,
        tx: any,
    ): Promise<void> {
        const config = configuration();
        const owners = await this.feedSourceRepository.findOwnersBySource(
            "user",
            payload.authorId,
            tx,
        );

        if (!owners.length) {
            return;
        }

        const createdAt = new Date(payload.createdAt);

        const items = owners.map((ownerUserId) => ({
            ownerUserId,
            postId: payload.postId,
            authorType: "user" as const,
            authorId: payload.authorId,
            createdAt,
            rankTime: createdAt,
            payload: {
                text: payload.text,
                media: payload.media,
            },
        }));

        await this.feedRepository.insertMany(items, tx);

        for (const owner of owners) {
            await this.feedRepository.trimFeedForOwner(
                owner,
                config.feedMaxSize,
                tx,
            );
        }
    }

    private async handlePostUpdated(
        payload: PostUpdatedPayload,
        tx: any,
    ): Promise<void> {
        await this.feedRepository.updatePayloadByPostId(payload.postId, {
            text: payload.text,
            media: payload.media,
        }, tx);
    }

    private async handlePostDeleted(
        payload: PostDeletedPayload,
        tx: any,
    ): Promise<void> {
        await this.feedRepository.softDeleteByPostId(payload.postId, tx);
    }
}

