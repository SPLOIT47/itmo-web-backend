import { feed_sources } from "../../db/schema";
type FeedSourceInsert = typeof feed_sources.$inferInsert;
type SourceType = FeedSourceInsert["sourceType"];
export declare class FeedSourceRepository {
    addSource(ownerUserId: string, sourceType: SourceType, sourceId: string, createdAt: Date, tx?: any): Promise<void>;
    removeSource(ownerUserId: string, sourceType: SourceType, sourceId: string, tx?: any): Promise<void>;
    deleteByOwnerUserId(ownerUserId: string, tx?: any): Promise<void>;
    findOwnersBySource(sourceType: SourceType, sourceId: string, tx?: any): Promise<string[]>;
}
export {};
