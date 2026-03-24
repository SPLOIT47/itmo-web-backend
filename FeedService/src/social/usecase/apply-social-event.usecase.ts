import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
import { feed_items } from "../../db/schema";
import type { FeedItemPayload } from "../../feed/payload/response/feed-item.response";

type FeedItemInsert = typeof feed_items.$inferInsert;

type SocialBackfillHint =
    | { kind: "friend"; data: FriendAddedPayload }
    | { kind: "community"; data: CommunitySubscribedPayload };

const FEED_SOCIAL_TYPES: SocialEventType[] = [
    SocialEventType.FRIEND_ADDED,
    SocialEventType.FRIEND_REMOVED,
    SocialEventType.COMMUNITY_SUBSCRIBED,
    SocialEventType.COMMUNITY_UNSUBSCRIBED,
];

@Injectable()
export class ApplySocialEventUseCase {
    private readonly log = new Logger(ApplySocialEventUseCase.name);

    constructor(
        private readonly inboxRepository: InboxRepository,
        private readonly feedSourceRepository: FeedSourceRepository,
        private readonly feedRepository: FeedRepository,
        private readonly config: ConfigService,
    ) {}

    async handle(event: SocialEvent): Promise<void> {
        const backfillAfter = await db.transaction(async (tx) => {
            if (await this.inboxRepository.exists(event.eventId, tx)) {
                return null;
            }

            if (!FEED_SOCIAL_TYPES.includes(event.eventType)) {
                await this.inboxRepository.save(
                    {
                        eventId: event.eventId,
                        aggregateId: event.eventId,
                        version: 1,
                        eventType: `IGNORED_${String(event.eventType).slice(0, 100)}`,
                    },
                    tx,
                );
                return null;
            }

            const payload = event.payload as
                | FriendAddedPayload
                | FriendRemovedPayload
                | CommunitySubscribedPayload
                | CommunityUnsubscribedPayload;

            const aggregateId = payload.userId;
            const currentVersion =
                (await this.inboxRepository.getLastVersionForAggregate(
                    aggregateId,
                    tx,
                )) ?? 0;
            const newVersion = currentVersion + 1;

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

            if (event.eventType === SocialEventType.FRIEND_ADDED) {
                return {
                    kind: "friend",
                    data: payload as FriendAddedPayload,
                } satisfies SocialBackfillHint;
            }
            if (event.eventType === SocialEventType.COMMUNITY_SUBSCRIBED) {
                return {
                    kind: "community",
                    data: payload as CommunitySubscribedPayload,
                } satisfies SocialBackfillHint;
            }
            return null;
        });

        if (backfillAfter?.kind === "friend") {
            try {
                await this.backfillFriendPostsFromContent(backfillAfter.data);
            } catch (e) {
                const bf = backfillAfter.data;
                this.log.error(
                    `Backfill friend posts subscriber=${bf.userId} friend=${bf.friendId}`,
                    e,
                );
            }
        }
        if (backfillAfter?.kind === "community") {
            try {
                await this.backfillCommunityPostsFromContent(backfillAfter.data);
            } catch (e) {
                const p = backfillAfter.data;
                this.log.error(
                    `Backfill community posts user=${p.userId} community=${p.communityId}`,
                    e,
                );
            }
        }
    }

    private async backfillFriendPostsFromContent(
        p: FriendAddedPayload,
    ): Promise<void> {
        const base = this.config.get<string>("contentServiceUrl")?.trim();
        if (!base) {
            return;
        }

        const url = `${base.replace(/\/$/, "")}/posts/user/${encodeURIComponent(p.friendId)}?limit=100&offset=0`;
        const res = await fetch(url);
        if (!res.ok) {
            this.log.warn(`Backfill GET ${url} -> ${res.status}`);
            return;
        }

        const posts = (await res.json()) as Array<{
            postId: string;
            authorId: string;
            text: string;
            media: string[];
            createdAt: string;
        }>;

        if (!Array.isArray(posts) || posts.length === 0) {
            return;
        }

        const feedMaxSize = this.config.get<number>("feedMaxSize") ?? 500;

        await db.transaction(async (tx) => {
            const ids = posts.map((row) => row.postId);
            const existing =
                await this.feedRepository.findExistingPostIdsForOwner(
                    p.userId,
                    ids,
                    tx,
                );

            const items: FeedItemInsert[] = [];
            for (const row of posts) {
                if (existing.has(row.postId)) {
                    continue;
                }
                const createdAt = new Date(row.createdAt);
                const payload: FeedItemPayload = {
                    text: row.text,
                    media: row.media ?? [],
                    likes: [],
                    comments: [],
                };
                items.push({
                    ownerUserId: p.userId,
                    postId: row.postId,
                    authorType: "user",
                    authorId: row.authorId,
                    createdAt,
                    rankTime: createdAt,
                    payload,
                });
            }

            if (items.length === 0) {
                return;
            }

            await this.feedRepository.insertMany(items, tx);
            await this.feedRepository.trimFeedForOwner(
                p.userId,
                feedMaxSize,
                tx,
            );
        });
    }

    private async backfillCommunityPostsFromContent(
        p: CommunitySubscribedPayload,
    ): Promise<void> {
        const base = this.config.get<string>("contentServiceUrl")?.trim();
        if (!base) {
            return;
        }

        const url = `${base.replace(/\/$/, "")}/posts/user/${encodeURIComponent(p.communityId)}?limit=100&offset=0`;
        const res = await fetch(url);
        if (!res.ok) {
            this.log.warn(`Backfill community GET ${url} -> ${res.status}`);
            return;
        }

        const posts = (await res.json()) as Array<{
            postId: string;
            authorId: string;
            text: string;
            media: string[];
            createdAt: string;
            likes?: string[];
            comments?: Array<{
                id: string;
                authorId: string;
                text: string;
                createdAt: string;
                updatedAt: string;
            }>;
        }>;

        if (!Array.isArray(posts) || posts.length === 0) {
            return;
        }

        const feedMaxSize = this.config.get<number>("feedMaxSize") ?? 500;

        await db.transaction(async (tx) => {
            const ids = posts.map((row) => row.postId);
            const existing =
                await this.feedRepository.findExistingPostIdsForOwner(
                    p.userId,
                    ids,
                    tx,
                );

            const items: FeedItemInsert[] = [];
            for (const row of posts) {
                if (existing.has(row.postId)) {
                    continue;
                }
                const createdAt = new Date(row.createdAt);
                const payloadItem: FeedItemPayload = {
                    text: row.text,
                    media: row.media ?? [],
                    likes: row.likes ?? [],
                    comments: (row.comments ?? []).map((c) => ({
                        id: c.id,
                        authorId: c.authorId,
                        text: c.text,
                        createdAt: c.createdAt,
                        updatedAt: c.updatedAt,
                    })),
                };
                items.push({
                    ownerUserId: p.userId,
                    postId: row.postId,
                    authorType: "community",
                    authorId: p.communityId,
                    createdAt,
                    rankTime: createdAt,
                    payload: payloadItem,
                });
            }

            if (items.length === 0) {
                return;
            }

            await this.feedRepository.insertMany(items, tx);
            await this.feedRepository.trimFeedForOwner(
                p.userId,
                feedMaxSize,
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
            new Date(payload.createdAt ?? Date.now()),
            tx,
        );
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
            new Date(payload.createdAt ?? Date.now()),
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

