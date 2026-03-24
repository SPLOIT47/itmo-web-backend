import { FeedRepository } from "../repository/feed.repository";
import { FeedSourceRepository } from "../repository/feed-source.repository";
import { FeedItemResponseDto } from "../payload/response/feed-item.response";
export declare class FeedService {
    private readonly feedRepository;
    private readonly feedSourceRepository;
    constructor(feedRepository: FeedRepository, feedSourceRepository: FeedSourceRepository);
    getFeedForUser(userId: string, limit: number, offset: number): Promise<FeedItemResponseDto[]>;
    getCommunityPosts(userId: string, communityId: string, limit: number, offset: number): Promise<FeedItemResponseDto[]>;
    deleteMyFeed(userId: string): Promise<void>;
}
