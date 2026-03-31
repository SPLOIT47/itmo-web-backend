import { Injectable } from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db/db";
import { likes } from "../../db/schema";

type LikeInsert = typeof likes.$inferInsert;
type LikeSelect = typeof likes.$inferSelect;

@Injectable()
export class LikeRepository {
    async findByPostAndUser(postId: string, userId: string, tx: any = db): Promise<LikeSelect | undefined> {
        const rows = await tx
            .select()
            .from(likes)
            .where(
                and(
                    eq(likes.postId, postId),
                    eq(likes.userId, userId),
                ),
            )
            .limit(1);
        return rows[0];
    }

    async listByUser(userId: string, tx: any = db): Promise<LikeSelect[]> {
        return tx
            .select()
            .from(likes)
            .where(eq(likes.userId, userId));
    }

    async listByPostIds(postIds: string[], tx: any = db): Promise<LikeSelect[]> {
        if (!postIds.length) return [];
        return tx
            .select()
            .from(likes)
            .where(inArray(likes.postId, postIds));
    }

    async create(data: LikeInsert, tx: any = db): Promise<LikeSelect> {
        const rows = await tx.insert(likes).values(data).returning();
        return rows[0]!;
    }

    async delete(postId: string, userId: string, tx: any = db): Promise<void> {
        await tx
            .delete(likes)
            .where(
                and(
                    eq(likes.postId, postId),
                    eq(likes.userId, userId),
                ),
            );
    }
}
