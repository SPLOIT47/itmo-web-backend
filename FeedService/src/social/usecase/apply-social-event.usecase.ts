import { Injectable } from "@nestjs/common";
import { db } from "../../db/db";
import { FeedSourceRepository } from "../../feed/repository/feed-source.repository";
import { FeedRepository } from "../../feed/repository/feed.repository";
import { InboxRepository } from "../../inbox/repository/inbox.repository";
import {
    FriendAddedPayload,
    FriendRemovedPayload,
    SocialEvent,
    SocialEventType,
    CommunitySubscribedPayload,
    CommunityUnsubscribedPayload,
} from "@app/contracts/kafka/social";

@Injectable()
export class ApplySocialEventUseCase {
    constructor(
        private readonly inboxRepository: InboxRepository,
        private readonly feedSourceRepository: FeedSourceRepository,
        private readonly feedRepository: FeedRepository,
    ) {}

    async handle(event: SocialEvent): Promise<void> {
        await db.transaction(async (tx) => {
            if (await this.inboxRepository.exists(event.eventId, tx)) {
                return;
            }

            const payload = event.payload as
                | FriendAddedPayload
                | FriendRemovedPayload
                | CommunitySubscribedPayload
                | CommunityUnsubscribedPayload;

            const aggregateId =
                "friendId" in payload || "communityId" in payload
                    ? payload.userId
                    : payload.userId;
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
                return;
            }

            switch (event.eventType) {
                case SocialEventType.FRIEND_ADDED:
                    await this.handleFriendAdded(
                        payload as FriendAddedPayload,
                        tx,
                    );
                    break;
                case SocialEventType.FRIEND_REMOVED:
                    await this.handleFriendRemoved(
                        payload as FriendRemovedPayload,
                        tx,
                    );
                    break;
                case SocialEventType.COMMUNITY_SUBSCRIBED:
                    await this.handleCommunitySubscribed(
                        payload as CommunitySubscribedPayload,
                        tx,
                    );
                    break;
                case SocialEventType.COMMUNITY_UNSUBSCRIBED:
                    await this.handleCommunityUnsubscribed(
                        payload as CommunityUnsubscribedPayload,
                        tx,
                    );
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

    private async handleFriendAdded(
        payload: FriendAddedPayload,
        tx: any,
    ): Promise<void> {
        await this.feedSourceRepository.addSource(
            payload.userId,
            "user",
            payload.friendId,
            new Date(payload.createdAt),
            tx,
        );
        // backfill можно реализовать отдельно, если понадобится
    }

    private async handleFriendRemoved(
        payload: FriendRemovedPayload,
        tx: any,
    ): Promise<void> {
        await this.feedSourceRepository.removeSource(
            payload.userId,
            "user",
            payload.friendId,
            tx,
        );
        await this.feedRepository.deleteByOwnerAndAuthor(
            payload.userId,
            "user",
            payload.friendId,
            tx,
        );
    }

    private async handleCommunitySubscribed(
        payload: CommunitySubscribedPayload,
        tx: any,
    ): Promise<void> {
        await this.feedSourceRepository.addSource(
            payload.userId,
            "community",
            payload.communityId,
            new Date(payload.createdAt),
            tx,
        );
    }

    private async handleCommunityUnsubscribed(
        payload: CommunityUnsubscribedPayload,
        tx: any,
    ): Promise<void> {
        await this.feedSourceRepository.removeSource(
            payload.userId,
            "community",
            payload.communityId,
            tx,
        );
        await this.feedRepository.deleteByOwnerAndAuthor(
            payload.userId,
            "community",
            payload.communityId,
            tx,
        );
    }
}

