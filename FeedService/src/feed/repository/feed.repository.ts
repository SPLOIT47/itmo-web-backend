import { Injectable } from "@nestjs/common";
import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { feed_items } from "../../db/schema";
import type { FeedItemPayload } from "../payload/response/feed-item.response";

type FeedItemInsert = typeof feed_items.$inferInsert;
type FeedItemSelect = typeof feed_items.$inferSelect;

@Injectable()
export class FeedRepository {
    async findFeedForUser(ownerUserId: string, limit: number, offset: number, tx: any = db): Promise<FeedItemSelect[]> {
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

    async findExistingPostIdsForOwner(ownerUserId: string, postIds: string[], tx: any = db): Promise<Set<string>> {
        if (postIds.length === 0) {
            return new Set();
        }
        const rows = await tx
            .select({ postId: feed_items.postId })
            .from(feed_items)
            .where(
                and(
                    eq(feed_items.ownerUserId, ownerUserId),
                    inArray(feed_items.postId, postIds),
                    isNull(feed_items.deletedAt),
                ),
            );
        return new Set(rows.map((r) => r.postId));
    }

    async trimFeedForOwner(ownerUserId: string, maxSize: number, tx: any = db): Promise<void> {
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

    async updatePayloadByPostId(postId: string, payload: unknown, tx: any = db): Promise<void> {
        await tx
            .update(feed_items)
            .set({ payload })
            .where(
                and(
                    eq(feed_items.postId, postId),
                    isNull(feed_items.deletedAt),
                ),
            );
    }

    async softDeleteByPostId(postId: string, tx: any = db): Promise<void> {
        await tx
            .update(feed_items)
            .set({ deletedAt: sql`now()` })
            .where(eq(feed_items.postId, postId));
    }

    async getPayloadByPostId(postId: string, tx: any = db): Promise<FeedItemPayload | null> {
        const rows = await tx
            .select({ payload: feed_items.payload })
            .from(feed_items)
            .where(
                and(
                    eq(feed_items.postId, postId),
                    isNull(feed_items.deletedAt),
                ),
            )
            .limit(1);

        return (rows[0]?.payload ?? null) as any;
    }

    async findCommunityPosts(
        ownerUserId: string,
        communityId: string,
        limit: number,
        offset: number,
        tx: any = db,
    ): Promise<
        Array<{
            postId: string;
            authorType: "user" | "community";
            authorId: string;
            createdAt: Date;
            payload: unknown;
        }>
    > {
        const fetchSize = limit + offset + 50;
        const rows = await tx
            .select()
            .from(feed_items)
            .where(
                and(
                    eq(feed_items.ownerUserId, ownerUserId),
                    eq(feed_items.authorType, "community"),
                    eq(feed_items.authorId, communityId),
                    isNull(feed_items.deletedAt),
                ),
            )
            .orderBy(desc(feed_items.rankTime))
            .limit(fetchSize);

        const seen = new Set<string>();
        const unique: typeof rows = [];

        for (const row of rows) {
            if (seen.has(row.postId)) continue;
            seen.add(row.postId);
            unique.push(row);
        }

        const sliced = unique.slice(offset, offset + limit);

        return sliced.map((r) => ({
            postId: r.postId,
            authorType: r.authorType,
            authorId: r.authorId,
            createdAt: r.createdAt,
            payload: r.payload,
        }));
    }

    async deleteByOwnerUserId(ownerUserId: string, tx: any = db): Promise<void> {
        await tx
            .update(feed_items)
            .set({ deletedAt: sql`now()` })
            .where(and(eq(feed_items.ownerUserId, ownerUserId), isNull(feed_items.deletedAt)));
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

