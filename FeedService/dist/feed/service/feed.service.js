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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedService = void 0;
const common_1 = require("@nestjs/common");
const feed_repository_1 = require("../repository/feed.repository");
const feed_source_repository_1 = require("../repository/feed-source.repository");
let FeedService = class FeedService {
    feedRepository;
    feedSourceRepository;
    constructor(feedRepository, feedSourceRepository) {
        this.feedRepository = feedRepository;
        this.feedSourceRepository = feedSourceRepository;
    }
    async getFeedForUser(userId, limit, offset) {
        const rows = await this.feedRepository.findFeedForUser(userId, limit, offset);
        return rows.map((row) => ({
            postId: row.postId,
            authorType: row.authorType,
            authorId: row.authorId,
            createdAt: row.createdAt.toISOString(),
            payload: {
                ...row.payload,
                likes: (row.payload?.likes ?? []),
                comments: (row.payload?.comments ?? []),
            },
        }));
    }
    async getCommunityPosts(userId, communityId, limit, offset) {
        const rows = await this.feedRepository.findCommunityPosts(userId, communityId, limit, offset);
        return rows.map((row) => ({
            postId: row.postId,
            authorType: row.authorType,
            authorId: row.authorId,
            createdAt: row.createdAt.toISOString(),
            payload: {
                ...row.payload,
                likes: (row.payload?.likes ?? []),
                comments: (row.payload?.comments ?? []),
            },
        }));
    }
    async deleteMyFeed(userId) {
        await this.feedRepository.deleteByOwnerUserId(userId);
        await this.feedSourceRepository.deleteByOwnerUserId(userId);
    }
};
exports.FeedService = FeedService;
exports.FeedService = FeedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [feed_repository_1.FeedRepository,
        feed_source_repository_1.FeedSourceRepository])
], FeedService);
//# sourceMappingURL=feed.service.js.map