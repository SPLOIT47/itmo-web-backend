import { FeedService } from "../service/feed.service";
import { GetFeedQueryDto } from "../payload/request/get-feed.request";
import { FeedItemResponseDto } from "../payload/response/feed-item.response";
export declare class FeedController {
    private readonly feedService;
    constructor(feedService: FeedService);
    getMyFeed(userId: string | undefined, query: GetFeedQueryDto): Promise<FeedItemResponseDto[]>;
    getCommunityPosts(userId: string | undefined, communityId: string, query: GetFeedQueryDto): Promise<FeedItemResponseDto[]>;
    getUserFeed(userId: string, query: GetFeedQueryDto): Promise<FeedItemResponseDto[]>;
    deleteMyFeed(userId: string | undefined): Promise<void>;
}
