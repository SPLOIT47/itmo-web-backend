import { Injectable } from "@nestjs/common";
import { FeedRepository } from "../repository/feed.repository";
import { FeedItemResponseDto } from "../payload/response/feed-item.response";

@Injectable()
export class FeedService {
    constructor(private readonly feedRepository: FeedRepository) {}

    async getFeedForUser(
        userId: string,
        limit: number,
        offset: number,
    ): Promise<FeedItemResponseDto[]> {
        const rows = await this.feedRepository.findFeedForUser(
            userId,
            limit,
            offset,
        );

        return rows.map((row) => ({
            postId: row.postId,
            authorType: row.authorType as "user" | "community",
            authorId: row.authorId,
            createdAt: row.createdAt.toISOString(),
            payload: row.payload as any,
        }));
    }
}

