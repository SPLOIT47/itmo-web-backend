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
    PostLikedPayload,
    PostUnlikedPayload,
    CommentCreatedPayload,
    CommentDeletedPayload,
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
        if (!event?.eventId || !event?.eventType) {
            this.log.warn(
                `Пропуск content-события: нет eventId/eventType: ${JSON.stringify({
                    hasEventId: !!event?.eventId,
                    hasEventType: !!event?.eventType,
                })}`,
            );
            return;
        }

        let communityOwnerUserId: string | undefined;
        if (event.eventType === ContentEventType.POST_CREATED) {
            const p = event.payload as PostCreatedPayload;
            const kind = p.postAuthorKind ?? "user";
            if (kind === "community" && p.authorId) {
                communityOwnerUserId =
                    await this.fetchCommunityOwnerUserId(p.authorId);
            }
        }

        await db.transaction(async (tx) => {
            if (await this.inboxRepository.exists(event.eventId, tx)) {
                return;
            }

            const payload = event.payload as
                | PostCreatedPayload
                | PostUpdatedPayload
                | PostDeletedPayload
                | PostLikedPayload
                | PostUnlikedPayload
                | CommentCreatedPayload
                | CommentDeletedPayload;

            const newVersion = payload.version;

            const aggregateId =
                event.eventType === ContentEventType.COMMENT_CREATED ||
                event.eventType === ContentEventType.COMMENT_DELETED
                    ? (payload as CommentCreatedPayload | CommentDeletedPayload).commentId
                    : payload.postId;

            const currentVersion =
                (await this.inboxRepository.getLastVersionForAggregate(
                    aggregateId,
                    tx,
                )) ?? -1;

            if (newVersion < currentVersion) {
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
                    await this.handlePostCreated(
                        payload as PostCreatedPayload,
                        tx,
                        communityOwnerUserId,
                    );
                    break;
                case ContentEventType.POST_UPDATED:
                    await this.handlePostUpdated(payload as PostUpdatedPayload, tx);
                    break;
                case ContentEventType.POST_DELETED:
                    await this.handlePostDeleted(payload as PostDeletedPayload, tx);
                    break;
                case ContentEventType.POST_LIKED:
                    await this.handlePostLiked(payload as PostLikedPayload, tx);
                    break;
                case ContentEventType.POST_UNLIKED:
                    await this.handlePostUnliked(
                        payload as PostUnlikedPayload,
                        tx,
                    );
                    break;
                case ContentEventType.COMMENT_CREATED:
                    await this.handleCommentCreated(
                        payload as CommentCreatedPayload,
                        tx,
                    );
                    break;
                case ContentEventType.COMMENT_DELETED:
                    await this.handleCommentDeleted(
                        payload as CommentDeletedPayload,
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

    private async fetchCommunityOwnerUserId(
        communityId: string,
    ): Promise<string | undefined> {
        const base = configuration().socialServiceUrl?.trim();
        if (!base) {
            return undefined;
        }
        try {
            const url = `${base.replace(/\/$/, "")}/communities/${encodeURIComponent(communityId)}`;
            const res = await fetch(url);
            if (!res.ok) {
                return undefined;
            }
            const body = (await res.json()) as { ownerUserId?: string };
            return typeof body.ownerUserId === "string"
                ? body.ownerUserId
                : undefined;
        } catch (e) {
            this.log.warn(
                `SOCIAL fetch owner failed communityId=${communityId}`,
                e,
            );
            return undefined;
        }
    }

    private async handlePostCreated(
        payload: PostCreatedPayload,
        tx: any,
        communityOwnerUserId?: string,
    ): Promise<void> {
        const config = configuration();
        const ownersUser =
            await this.feedSourceRepository.findOwnersBySource(
                "user",
                payload.authorId,
                tx,
            );
        const ownersCommunity =
            await this.feedSourceRepository.findOwnersBySource(
                "community",
                payload.authorId,
                tx,
            );

        const postAuthorKind = payload.postAuthorKind ?? "user";

        let authorType: "user" | "community";
        let owners: string[];

        if (postAuthorKind === "community") {
            authorType = "community";
            const set = new Set(ownersCommunity);
            if (payload.postedByUserId) {
                set.add(payload.postedByUserId);
            }
            if (communityOwnerUserId) {
                set.add(communityOwnerUserId);
            }
            owners = [...set];
        } else {
            authorType = "user";
            const set = new Set(ownersUser);
            set.add(payload.authorId);
            owners = [...set];
        }

        if (!owners.length) {
            this.log.warn(
                `POST_CREATED: no feed owners, skip fan-out postId=${payload.postId} postAuthorKind=${postAuthorKind} authorId=${payload.authorId}`,
            );
            return;
        }

        const createdAt = new Date(payload.createdAt);

        const items = owners.map((ownerUserId) => ({
            ownerUserId,
            postId: payload.postId,
            authorType,
            authorId: payload.authorId,
            createdAt,
            rankTime: createdAt,
            payload: {
                text: payload.text,
                media: payload.media,
                likes: [],
                comments: [],
            },
        }));

        await this.feedRepository.insertMany(items, tx);

        this.log.log(
            `POST_CREATED: postId=${payload.postId} authorId=${payload.authorId} rows=${items.length} owners=${owners.join(",")}`,
        );

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
        const current =
            await this.feedRepository.getPayloadByPostId(payload.postId, tx);

        const nextPayload = current
            ? {
                  ...current,
                  text: payload.text ?? current.text,
                  media: payload.media ?? current.media,
              }
            : {
                  text: payload.text,
                  media: payload.media,
                  likes: [],
                  comments: [],
              };

        await this.feedRepository.updatePayloadByPostId(
            payload.postId,
            nextPayload,
            tx,
        );
    }

    private async handlePostDeleted(
        payload: PostDeletedPayload,
        tx: any,
    ): Promise<void> {
        await this.feedRepository.softDeleteByPostId(payload.postId, tx);
    }

    private async handlePostLiked(
        payload: PostLikedPayload,
        tx: any,
    ): Promise<void> {
        const current =
            await this.feedRepository.getPayloadByPostId(payload.postId, tx);
        if (!current) return;

        const likes = Array.isArray(current.likes)
            ? [...current.likes]
            : [];

        if (!likes.includes(payload.userId)) {
            likes.push(payload.userId);
        }

        await this.feedRepository.updatePayloadByPostId(payload.postId, {
            ...current,
            likes,
        }, tx);
    }

    private async handlePostUnliked(
        payload: PostUnlikedPayload,
        tx: any,
    ): Promise<void> {
        const current =
            await this.feedRepository.getPayloadByPostId(payload.postId, tx);
        if (!current) return;

        const likes = Array.isArray(current.likes)
            ? current.likes.filter((id) => id !== payload.userId)
            : [];

        await this.feedRepository.updatePayloadByPostId(payload.postId, {
            ...current,
            likes,
        }, tx);
    }

    private async handleCommentCreated(
        payload: CommentCreatedPayload,
        tx: any,
    ): Promise<void> {
        const current =
            await this.feedRepository.getPayloadByPostId(payload.postId, tx);
        if (!current) return;

        const comments = Array.isArray(current.comments)
            ? [...current.comments]
            : [];

        const exists = comments.some((c: any) => c.id === payload.commentId);
        if (!exists) {
            comments.push({
                id: payload.commentId,
                authorId: payload.authorId,
                text: payload.text,
                createdAt: payload.createdAt,
                updatedAt: payload.createdAt,
            });
        }

        comments.sort(
            (a: any, b: any) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
        );

        await this.feedRepository.updatePayloadByPostId(payload.postId, {
            ...current,
            comments,
        }, tx);
    }

    private async handleCommentDeleted(
        payload: CommentDeletedPayload,
        tx: any,
    ): Promise<void> {
        const current =
            await this.feedRepository.getPayloadByPostId(payload.postId, tx);
        if (!current) return;

        const comments = Array.isArray(current.comments)
            ? current.comments.filter((c: any) => c.id !== payload.commentId)
            : [];

        await this.feedRepository.updatePayloadByPostId(payload.postId, {
            ...current,
            comments,
        }, tx);
    }
}

