import { Injectable } from "@nestjs/common";
import { FeedRepository } from "../repository/feed.repository";
import { FeedSourceRepository } from "../repository/feed-source.repository";
import { FeedItemResponseDto } from "../payload/response/feed-item.response";

@Injectable()
export class FeedService {
    constructor(
        private readonly feedRepository: FeedRepository,
        private readonly feedSourceRepository: FeedSourceRepository,
    ) {}

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
            payload: {
                ...(row.payload as any),
                likes: ((row.payload as any)?.likes ?? []) as string[],
                comments: ((row.payload as any)?.comments ?? []) as any,
            },
        }));
    }

    async getCommunityPosts(
        userId: string,
        communityId: string,
        limit: number,
        offset: number,
    ): Promise<FeedItemResponseDto[]> {
        const rows = await this.feedRepository.findCommunityPosts(
            userId,
            communityId,
            limit,
            offset,
        );

        return rows.map((row) => ({
            postId: row.postId,
            authorType: row.authorType as "user" | "community",
            authorId: row.authorId,
            createdAt: row.createdAt.toISOString(),
            payload: {
                ...(row.payload as any),
                likes: ((row.payload as any)?.likes ?? []) as string[],
                comments: ((row.payload as any)?.comments ?? []) as any,
            },
        }));
    }

    async deleteMyFeed(userId: string): Promise<void> {
        await this.feedRepository.deleteByOwnerUserId(userId);
        await this.feedSourceRepository.deleteByOwnerUserId(userId);
    }
}

