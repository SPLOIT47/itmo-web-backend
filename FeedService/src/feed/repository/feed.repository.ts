import { Injectable } from "@nestjs/common";
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { feed_items } from "../../db/schema";

type FeedItemInsert = typeof feed_items.$inferInsert;
type FeedItemSelect = typeof feed_items.$inferSelect;

@Injectable()
export class FeedRepository {
    async findFeedForUser(
        ownerUserId: string,
        limit: number,
        offset: number,
        tx: any = db,
    ): Promise<FeedItemSelect[]> {
        return tx
            .select()
            .from(feed_items)
            .where(
                and(
                    eq(feed_items.ownerUserId, ownerUserId),
                    isNull(feed_items.deletedAt),
                ),
            )
            .orderBy(desc(feed_items.rankTime))
            .limit(limit)
            .offset(offset);
    }

    async insertMany(items: FeedItemInsert[], tx: any = db): Promise<void> {
        if (!items.length) return;
        await tx.insert(feed_items).values(items);
    }

    async trimFeedForOwner(
        ownerUserId: string,
        maxSize: number,
        tx: any = db,
    ): Promise<void> {
        const rows = await tx
            .select({
                rankTime: feed_items.rankTime,
            })
            .from(feed_items)
            .where(eq(feed_items.ownerUserId, ownerUserId))
            .orderBy(desc(feed_items.rankTime))
            .offset(maxSize)
            .limit(1);

        const threshold = rows[0]?.rankTime;
        if (!threshold) return;

        await tx
            .update(feed_items)
            .set({
                deletedAt: sql`now()`,
            })
            .where(
                and(
                    eq(feed_items.ownerUserId, ownerUserId),
                    lt(feed_items.rankTime, threshold),
                    isNull(feed_items.deletedAt),
                ),
            );
    }

    async updatePayloadByPostId(
        postId: string,
        payload: unknown,
        tx: any = db,
    ): Promise<void> {
        await tx
            .update(feed_items)
            .set({ payload })
            .where(eq(feed_items.postId, postId));
    }

    async softDeleteByPostId(postId: string, tx: any = db): Promise<void> {
        await tx
            .update(feed_items)
            .set({ deletedAt: sql`now()` })
            .where(eq(feed_items.postId, postId));
    }

    async deleteByOwnerAndAuthor(
        ownerUserId: string,
        authorType: "user" | "community",
        authorId: string,
        tx: any = db,
    ): Promise<void> {
        await tx
            .update(feed_items)
            .set({ deletedAt: sql`now()` })
            .where(
                and(
                    eq(feed_items.ownerUserId, ownerUserId),
                    eq(feed_items.authorType, authorType),
                    eq(feed_items.authorId, authorId),
                    isNull(feed_items.deletedAt),
                ),
            );
    }
}

