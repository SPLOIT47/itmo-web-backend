import { feed_items } from "../../db/schema";
import type { FeedItemPayload } from "../payload/response/feed-item.response";
type FeedItemInsert = typeof feed_items.$inferInsert;
type FeedItemSelect = typeof feed_items.$inferSelect;
export declare class FeedRepository {
    findFeedForUser(ownerUserId: string, limit: number, offset: number, tx?: any): Promise<FeedItemSelect[]>;
    insertMany(items: FeedItemInsert[], tx?: any): Promise<void>;
    findExistingPostIdsForOwner(ownerUserId: string, postIds: string[], tx?: any): Promise<Set<string>>;
    trimFeedForOwner(ownerUserId: string, maxSize: number, tx?: any): Promise<void>;
    updatePayloadByPostId(postId: string, payload: unknown, tx?: any): Promise<void>;
    softDeleteByPostId(postId: string, tx?: any): Promise<void>;
    getPayloadByPostId(postId: string, tx?: any): Promise<FeedItemPayload | null>;
    findCommunityPosts(ownerUserId: string, communityId: string, limit: number, offset: number, tx?: any): Promise<Array<{
        postId: string;
        authorType: "user" | "community";
        authorId: string;
        createdAt: Date;
        payload: unknown;
    }>>;
    deleteByOwnerUserId(ownerUserId: string, tx?: any): Promise<void>;
    deleteByOwnerAndAuthor(ownerUserId: string, authorType: "user" | "community", authorId: string, tx?: any): Promise<void>;
}
export {};
