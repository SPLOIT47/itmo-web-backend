import { Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/db";
import { feed_sources } from "../../db/schema";

type FeedSourceInsert = typeof feed_sources.$inferInsert;
type SourceType = FeedSourceInsert["sourceType"];

@Injectable()
export class FeedSourceRepository {
    async addSource(
        ownerUserId: string,
        sourceType: SourceType,
        sourceId: string,
        createdAt: Date,
        tx: any = db,
    ): Promise<void> {
        await tx
            .insert(feed_sources)
            .values({
                ownerUserId,
                sourceType,
                sourceId,
                createdAt,
            })
            .onConflictDoNothing({
                target: [
                    feed_sources.ownerUserId,
                    feed_sources.sourceType,
                    feed_sources.sourceId,
                ],
            });
    }

    async removeSource(
        ownerUserId: string,
        sourceType: SourceType,
        sourceId: string,
        tx: any = db,
    ): Promise<void> {
        await tx
            .delete(feed_sources)
            .where(
                and(
                    eq(feed_sources.ownerUserId, ownerUserId),
                    eq(feed_sources.sourceType, sourceType),
                    eq(feed_sources.sourceId, sourceId),
                ),
            );
    }

    async findOwnersBySource(
        sourceType: SourceType,
        sourceId: string,
        tx: any = db,
    ): Promise<string[]> {
        const rows = await tx
            .select({
                ownerUserId: feed_sources.ownerUserId,
            })
            .from(feed_sources)
            .where(
                and(
                    eq(feed_sources.sourceType, sourceType),
                    eq(feed_sources.sourceId, sourceId),
                ),
            );

        return rows.map((r: { ownerUserId: string }) => r.ownerUserId);
    }
}

