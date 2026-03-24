import {
    BadRequestException,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    Query,
} from "@nestjs/common";
import { HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FeedService } from "../service/feed.service";
import { GetFeedQueryDto } from "../payload/request/get-feed.request";
import { FeedItemResponseDto } from "../payload/response/feed-item.response";

@ApiTags("feed")
@Controller("feed")
export class FeedController {
    constructor(private readonly feedService: FeedService) {}

    @Get("me")
    async getMyFeed(
        @Headers("x-user-id") userId: string | undefined,
        @Query() query: GetFeedQueryDto,
    ): Promise<FeedItemResponseDto[]> {
        const uid = userId?.trim();
        if (!uid) {
            throw new BadRequestException(
                "Missing x-user-id (используйте Gateway с JWT или передайте заголовок вручную)",
            );
        }
        return this.feedService.getFeedForUser(uid, query.limit, query.offset);
    }

    @Get("community/:communityId")
    async getCommunityPosts(
        @Headers("x-user-id") userId: string | undefined,
        @Param("communityId") communityId: string,
        @Query() query: GetFeedQueryDto,
    ): Promise<FeedItemResponseDto[]> {
        const uid = userId?.trim();
        if (!uid) {
            throw new BadRequestException(
                "Missing x-user-id (используйте Gateway с JWT или передайте заголовок вручную)",
            );
        }
        return this.feedService.getCommunityPosts(
            uid,
            communityId,
            query.limit,
            query.offset,
        );
    }

    @Get(":userId")
    async getUserFeed(
        @Param("userId") userId: string,
        @Query() query: GetFeedQueryDto,
    ): Promise<FeedItemResponseDto[]> {
        return this.feedService.getFeedForUser(userId, query.limit, query.offset);
    }

    @Delete("me")
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteMyFeed(
        @Headers("x-user-id") userId: string | undefined,
    ): Promise<void> {
        const uid = userId?.trim();
        if (!uid) {
            throw new BadRequestException(
                "Missing x-user-id (используйте Gateway с JWT или передайте заголовок вручную)",
            );
        }
        await this.feedService.deleteMyFeed(uid);
    }
}

