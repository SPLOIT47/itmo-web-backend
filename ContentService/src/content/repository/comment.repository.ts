import { Injectable } from "@nestjs/common";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { comments } from "../../db/schema";

type CommentInsert = typeof comments.$inferInsert;
type CommentSelect = typeof comments.$inferSelect;

@Injectable()
export class CommentRepository {
    async create(data: CommentInsert, tx: any = db): Promise<CommentSelect> {
        const rows = await tx.insert(comments).values(data).returning();
        return rows[0]!;
    }

    async findById(
        commentId: string,
        tx: any = db,
    ): Promise<CommentSelect | undefined> {
        const rows = await tx
            .select()
            .from(comments)
            .where(eq(comments.commentId, commentId))
            .limit(1);
        return rows[0];
    }

    async findActiveByAuthor(
        authorId: string,
        tx: any = db,
    ): Promise<CommentSelect[]> {
        return tx
            .select()
            .from(comments)
            .where(and(eq(comments.authorId, authorId), isNull(comments.deletedAt)))
            .orderBy(desc(comments.createdAt));
    }

    async listActiveByPostIds(
        postIds: string[],
        tx: any = db,
    ): Promise<CommentSelect[]> {
        if (!postIds.length) return [];
        return tx
            .select()
            .from(comments)
            .where(
                and(
                    inArray(comments.postId, postIds),
                    isNull(comments.deletedAt),
                ),
            )
            .orderBy(desc(comments.createdAt));
    }

    async setDeletedAtAndIncrementVersion(
        commentId: string,
        deletedAt: Date,
        tx: any = db,
    ): Promise<CommentSelect> {
        const rows = await tx
            .update(comments)
            .set({
                deletedAt,
                version: sql`${comments.version} + 1`,
            })
            .where(eq(comments.commentId, commentId))
            .returning();
        return rows[0]!;
    }
}
