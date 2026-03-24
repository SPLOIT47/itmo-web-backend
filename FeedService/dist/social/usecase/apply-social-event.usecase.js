"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApplySocialEventUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplySocialEventUseCase = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const db_1 = require("../../db/db");
const feed_source_repository_1 = require("../../feed/repository/feed-source.repository");
const feed_repository_1 = require("../../feed/repository/feed.repository");
const inbox_repository_1 = require("../../inbox/repository/inbox.repository");
const social_1 = require("@app/contracts/kafka/social");
const FEED_SOCIAL_TYPES = [
    social_1.SocialEventType.FRIEND_ADDED,
    social_1.SocialEventType.FRIEND_REMOVED,
    social_1.SocialEventType.COMMUNITY_SUBSCRIBED,
    social_1.SocialEventType.COMMUNITY_UNSUBSCRIBED,
];
let ApplySocialEventUseCase = ApplySocialEventUseCase_1 = class ApplySocialEventUseCase {
    inboxRepository;
    feedSourceRepository;
    feedRepository;
    config;
    log = new common_1.Logger(ApplySocialEventUseCase_1.name);
    constructor(inboxRepository, feedSourceRepository, feedRepository, config) {
        this.inboxRepository = inboxRepository;
        this.feedSourceRepository = feedSourceRepository;
        this.feedRepository = feedRepository;
        this.config = config;
    }
    async handle(event) {
        const backfillAfter = await db_1.db.transaction(async (tx) => {
            if (await this.inboxRepository.exists(event.eventId, tx)) {
                return null;
            }
            if (!FEED_SOCIAL_TYPES.includes(event.eventType)) {
                await this.inboxRepository.save({
                    eventId: event.eventId,
                    aggregateId: event.eventId,
                    version: 1,
                    eventType: `IGNORED_${String(event.eventType).slice(0, 100)}`,
                }, tx);
                return null;
            }
            const payload = event.payload;
            const aggregateId = payload.userId;
            const currentVersion = (await this.inboxRepository.getLastVersionForAggregate(aggregateId, tx)) ?? 0;
            const newVersion = currentVersion + 1;
            switch (event.eventType) {
                case social_1.SocialEventType.FRIEND_ADDED:
                    await this.handleFriendAdded(payload, tx);
                    break;
                case social_1.SocialEventType.FRIEND_REMOVED:
                    await this.handleFriendRemoved(payload, tx);
                    break;
                case social_1.SocialEventType.COMMUNITY_SUBSCRIBED:
                    await this.handleCommunitySubscribed(payload, tx);
                    break;
                case social_1.SocialEventType.COMMUNITY_UNSUBSCRIBED:
                    await this.handleCommunityUnsubscribed(payload, tx);
                    break;
                default:
                    break;
            }
            await this.inboxRepository.save({
                eventId: event.eventId,
                aggregateId,
                version: newVersion,
                eventType: event.eventType,
            }, tx);
            if (event.eventType === social_1.SocialEventType.FRIEND_ADDED) {
                return {
                    kind: "friend",
                    data: payload,
                };
            }
            if (event.eventType === social_1.SocialEventType.COMMUNITY_SUBSCRIBED) {
                return {
                    kind: "community",
                    data: payload,
                };
            }
            return null;
        });
        if (backfillAfter?.kind === "friend") {
            try {
                await this.backfillFriendPostsFromContent(backfillAfter.data);
            }
            catch (e) {
                const bf = backfillAfter.data;
                this.log.error(`Backfill friend posts subscriber=${bf.userId} friend=${bf.friendId}`, e);
            }
        }
        if (backfillAfter?.kind === "community") {
            try {
                await this.backfillCommunityPostsFromContent(backfillAfter.data);
            }
            catch (e) {
                const p = backfillAfter.data;
                this.log.error(`Backfill community posts user=${p.userId} community=${p.communityId}`, e);
            }
        }
    }
    async backfillFriendPostsFromContent(p) {
        const base = this.config.get("contentServiceUrl")?.trim();
        if (!base) {
            return;
        }
        const url = `${base.replace(/\/$/, "")}/posts/user/${encodeURIComponent(p.friendId)}?limit=100&offset=0`;
        const res = await fetch(url);
        if (!res.ok) {
            this.log.warn(`Backfill GET ${url} -> ${res.status}`);
            return;
        }
        const posts = (await res.json());
        if (!Array.isArray(posts) || posts.length === 0) {
            return;
        }
        const feedMaxSize = this.config.get("feedMaxSize") ?? 500;
        await db_1.db.transaction(async (tx) => {
            const ids = posts.map((row) => row.postId);
            const existing = await this.feedRepository.findExistingPostIdsForOwner(p.userId, ids, tx);
            const items = [];
            for (const row of posts) {
                if (existing.has(row.postId)) {
                    continue;
                }
                const createdAt = new Date(row.createdAt);
                const payload = {
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
            await this.feedRepository.trimFeedForOwner(p.userId, feedMaxSize, tx);
        });
    }
    async backfillCommunityPostsFromContent(p) {
        const base = this.config.get("contentServiceUrl")?.trim();
        if (!base) {
            return;
        }
        const url = `${base.replace(/\/$/, "")}/posts/user/${encodeURIComponent(p.communityId)}?limit=100&offset=0`;
        const res = await fetch(url);
        if (!res.ok) {
            this.log.warn(`Backfill community GET ${url} -> ${res.status}`);
            return;
        }
        const posts = (await res.json());
        if (!Array.isArray(posts) || posts.length === 0) {
            return;
        }
        const feedMaxSize = this.config.get("feedMaxSize") ?? 500;
        await db_1.db.transaction(async (tx) => {
            const ids = posts.map((row) => row.postId);
            const existing = await this.feedRepository.findExistingPostIdsForOwner(p.userId, ids, tx);
            const items = [];
            for (const row of posts) {
                if (existing.has(row.postId)) {
                    continue;
                }
                const createdAt = new Date(row.createdAt);
                const payloadItem = {
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
            await this.feedRepository.trimFeedForOwner(p.userId, feedMaxSize, tx);
        });
    }
    async handleFriendAdded(payload, tx) {
        await this.feedSourceRepository.addSource(payload.userId, "user", payload.friendId, new Date(payload.createdAt ?? Date.now()), tx);
    }
    async handleFriendRemoved(payload, tx) {
        await this.feedSourceRepository.removeSource(payload.userId, "user", payload.friendId, tx);
        await this.feedRepository.deleteByOwnerAndAuthor(payload.userId, "user", payload.friendId, tx);
    }
    async handleCommunitySubscribed(payload, tx) {
        await this.feedSourceRepository.addSource(payload.userId, "community", payload.communityId, new Date(payload.createdAt ?? Date.now()), tx);
    }
    async handleCommunityUnsubscribed(payload, tx) {
        await this.feedSourceRepository.removeSource(payload.userId, "community", payload.communityId, tx);
        await this.feedRepository.deleteByOwnerAndAuthor(payload.userId, "community", payload.communityId, tx);
    }
};
exports.ApplySocialEventUseCase = ApplySocialEventUseCase;
exports.ApplySocialEventUseCase = ApplySocialEventUseCase = ApplySocialEventUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inbox_repository_1.InboxRepository,
        feed_source_repository_1.FeedSourceRepository,
        feed_repository_1.FeedRepository,
        config_1.ConfigService])
], ApplySocialEventUseCase);
//# sourceMappingURL=apply-social-event.usecase.js.map