import {
    Controller,
    Get,
    Headers,
    Param,
    Query,
} from "@nestjs/common";
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
        @Headers("x-user-id") userId: string,
        @Query() query: GetFeedQueryDto,
    ): Promise<FeedItemResponseDto[]> {
        // In real gateway setup, header is expected to be validated earlier
        return this.feedService.getFeedForUser(userId, query.limit, query.offset);
    }

    @Get(":userId")
    async getUserFeed(
        @Param("userId") userId: string,
        @Query() query: GetFeedQueryDto,
    ): Promise<FeedItemResponseDto[]> {
        return this.feedService.getFeedForUser(userId, query.limit, query.offset);
    }
}

