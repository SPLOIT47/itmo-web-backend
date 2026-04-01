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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const feed_service_1 = require("../service/feed.service");
const get_feed_request_1 = require("../payload/request/get-feed.request");
let FeedController = class FeedController {
    feedService;
    constructor(feedService) {
        this.feedService = feedService;
    }
    async getMyFeed(userId, query) {
        const uid = userId?.trim();
        if (!uid) {
            throw new common_1.BadRequestException("Missing x-user-id");
        }
        return this.feedService.getFeedForUser(uid, query.limit, query.offset);
    }
    async getCommunityPosts(userId, communityId, query) {
        const uid = userId?.trim();
        if (!uid) {
            throw new common_1.BadRequestException("Missing x-user-id");
        }
        return this.feedService.getCommunityPosts(uid, communityId, query.limit, query.offset);
    }
    async getUserFeed(userId, query) {
        return this.feedService.getFeedForUser(userId, query.limit, query.offset);
    }
    async deleteMyFeed(userId) {
        const uid = userId?.trim();
        if (!uid) {
            throw new common_1.BadRequestException("Missing x-user-idы");
        }
        await this.feedService.deleteMyFeed(uid);
    }
};
exports.FeedController = FeedController;
__decorate([
    (0, common_1.Get)("me"),
    __param(0, (0, common_1.Headers)("x-user-id")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_feed_request_1.GetFeedQueryDto]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "getMyFeed", null);
__decorate([
    (0, common_1.Get)("community/:communityId"),
    __param(0, (0, common_1.Headers)("x-user-id")),
    __param(1, (0, common_1.Param)("communityId")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, get_feed_request_1.GetFeedQueryDto]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "getCommunityPosts", null);
__decorate([
    (0, common_1.Get)(":userId"),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_feed_request_1.GetFeedQueryDto]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "getUserFeed", null);
__decorate([
    (0, common_1.Delete)("me"),
    (0, common_2.HttpCode)(common_2.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Headers)("x-user-id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "deleteMyFeed", null);
exports.FeedController = FeedController = __decorate([
    (0, swagger_1.ApiTags)("feed"),
    (0, common_1.Controller)("feed"),
    __metadata("design:paramtypes", [feed_service_1.FeedService])
], FeedController);
//# sourceMappingURL=feed.controller.js.map