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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ApplyContentEventUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplyContentEventUseCase = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../../db/db");
const feed_repository_1 = require("../../feed/repository/feed.repository");
const feed_source_repository_1 = require("../../feed/repository/feed-source.repository");
const inbox_repository_1 = require("../../inbox/repository/inbox.repository");
const content_1 = require("@app/contracts/kafka/content");
const configuration_1 = __importDefault(require("../../config/configuration"));
let ApplyContentEventUseCase = ApplyContentEventUseCase_1 = class ApplyContentEventUseCase {
    inboxRepository;
    feedRepository;
    feedSourceRepository;
    log = new common_1.Logger(ApplyContentEventUseCase_1.name);
    constructor(inboxRepository, feedRepository, feedSourceRepository) {
        this.inboxRepository = inboxRepository;
        this.feedRepository = feedRepository;
        this.feedSourceRepository = feedSourceRepository;
    }
    async handle(event) {
        if (!event?.eventId || !event?.eventType) {
            return;
        }
        let communityOwnerUserId;
        if (event.eventType === content_1.ContentEventType.POST_CREATED) {
            const p = event.payload;
            const kind = p.postAuthorKind ?? "user";
            if (kind === "community" && p.authorId) {
                communityOwnerUserId =
                    await this.fetchCommunityOwnerUserId(p.authorId);
            }
        }
        await db_1.db.transaction(async (tx) => {
            if (await this.inboxRepository.exists(event.eventId, tx)) {
                return;
            }
            const payload = event.payload;
            const newVersion = payload.version;
            const aggregateId = event.eventType === content_1.ContentEventType.COMMENT_CREATED ||
                event.eventType === content_1.ContentEventType.COMMENT_DELETED
                ? payload.commentId
                : payload.postId;
            const currentVersion = (await this.inboxRepository.getLastVersionForAggregate(aggregateId, tx)) ?? -1;
            if (newVersion < currentVersion) {
                await this.inboxRepository.save({
                    eventId: event.eventId,
                    aggregateId,
                    version: newVersion,
                    eventType: event.eventType,
                }, tx);
                this.log.debug(`Ignoring stale content event=${event.eventId} type=${event.eventType}`);
                return;
            }
            switch (event.eventType) {
                case content_1.ContentEventType.POST_CREATED:
                    await this.handlePostCreated(payload, tx, communityOwnerUserId);
                    break;
                case content_1.ContentEventType.POST_UPDATED:
                    await this.handlePostUpdated(payload, tx);
                    break;
                case content_1.ContentEventType.POST_DELETED:
                    await this.handlePostDeleted(payload, tx);
                    break;
                case content_1.ContentEventType.POST_LIKED:
                    await this.handlePostLiked(payload, tx);
                    break;
                case content_1.ContentEventType.POST_UNLIKED:
                    await this.handlePostUnliked(payload, tx);
                    break;
                case content_1.ContentEventType.COMMENT_CREATED:
                    await this.handleCommentCreated(payload, tx);
                    break;
                case content_1.ContentEventType.COMMENT_DELETED:
                    await this.handleCommentDeleted(payload, tx);
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
        });
    }
    async fetchCommunityOwnerUserId(communityId) {
        const base = (0, configuration_1.default)().socialServiceUrl?.trim();
        if (!base) {
            return undefined;
        }
        try {
            const url = `${base.replace(/\/$/, "")}/communities/${encodeURIComponent(communityId)}`;
            const res = await fetch(url);
            if (!res.ok) {
                return undefined;
            }
            const body = (await res.json());
            return typeof body.ownerUserId === "string"
                ? body.ownerUserId
                : undefined;
        }
        catch (e) {
            this.log.warn(`SOCIAL fetch owner failed communityId=${communityId}`, e);
            return undefined;
        }
    }
    async handlePostCreated(payload, tx, communityOwnerUserId) {
        const config = (0, configuration_1.default)();
        const ownersUser = await this.feedSourceRepository.findOwnersBySource("user", payload.authorId, tx);
        const ownersCommunity = await this.feedSourceRepository.findOwnersBySource("community", payload.authorId, tx);
        const postAuthorKind = payload.postAuthorKind ?? "user";
        let authorType;
        let owners;
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
        }
        else {
            authorType = "user";
            const set = new Set(ownersUser);
            set.add(payload.authorId);
            owners = [...set];
        }
        if (!owners.length) {
            this.log.warn(`POST_CREATED: no feed owners, skip fan-out postId=${payload.postId} postAuthorKind=${postAuthorKind} authorId=${payload.authorId}`);
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
        this.log.log(`POST_CREATED: postId=${payload.postId} authorId=${payload.authorId} rows=${items.length} owners=${owners.join(",")}`);
        for (const owner of owners) {
            await this.feedRepository.trimFeedForOwner(owner, config.feedMaxSize, tx);
        }
    }
    async handlePostUpdated(payload, tx) {
        const current = await this.feedRepository.getPayloadByPostId(payload.postId, tx);
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
        await this.feedRepository.updatePayloadByPostId(payload.postId, nextPayload, tx);
    }
    async handlePostDeleted(payload, tx) {
        await this.feedRepository.softDeleteByPostId(payload.postId, tx);
    }
    async handlePostLiked(payload, tx) {
        const current = await this.feedRepository.getPayloadByPostId(payload.postId, tx);
        if (!current)
            return;
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
    async handlePostUnliked(payload, tx) {
        const current = await this.feedRepository.getPayloadByPostId(payload.postId, tx);
        if (!current)
            return;
        const likes = Array.isArray(current.likes)
            ? current.likes.filter((id) => id !== payload.userId)
            : [];
        await this.feedRepository.updatePayloadByPostId(payload.postId, {
            ...current,
            likes,
        }, tx);
    }
    async handleCommentCreated(payload, tx) {
        const current = await this.feedRepository.getPayloadByPostId(payload.postId, tx);
        if (!current)
            return;
        const comments = Array.isArray(current.comments)
            ? [...current.comments]
            : [];
        const exists = comments.some((c) => c.id === payload.commentId);
        if (!exists) {
            comments.push({
                id: payload.commentId,
                authorId: payload.authorId,
                text: payload.text,
                createdAt: payload.createdAt,
                updatedAt: payload.createdAt,
            });
        }
        comments.sort((a, b) => new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime());
        await this.feedRepository.updatePayloadByPostId(payload.postId, {
            ...current,
            comments,
        }, tx);
    }
    async handleCommentDeleted(payload, tx) {
        const current = await this.feedRepository.getPayloadByPostId(payload.postId, tx);
        if (!current)
            return;
        const comments = Array.isArray(current.comments)
            ? current.comments.filter((c) => c.id !== payload.commentId)
            : [];
        await this.feedRepository.updatePayloadByPostId(payload.postId, {
            ...current,
            comments,
        }, tx);
    }
};
exports.ApplyContentEventUseCase = ApplyContentEventUseCase;
exports.ApplyContentEventUseCase = ApplyContentEventUseCase = ApplyContentEventUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inbox_repository_1.InboxRepository,
        feed_repository_1.FeedRepository,
        feed_source_repository_1.FeedSourceRepository])
], ApplyContentEventUseCase);
//# sourceMappingURL=apply-content-event.usecase.js.map