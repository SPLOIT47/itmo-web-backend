import { Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
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
