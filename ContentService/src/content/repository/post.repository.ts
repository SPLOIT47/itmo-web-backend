import { Injectable } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { posts } from "../../db/schema";

type PostInsert = typeof posts.$inferInsert;
type PostSelect = typeof posts.$inferSelect;

@Injectable()
export class PostRepository {
    async create(data: PostInsert, tx: any = db): Promise<PostSelect> {
        const rows = await tx.insert(posts).values(data).returning();
        return rows[0]!;
    }

    async findById(postId: string, tx: any = db): Promise<PostSelect | undefined> {
        const rows = await tx
            .select()
            .from(posts)
            .where(eq(posts.postId, postId))
            .limit(1);
        return rows[0];
    }

    async findByIdNotDeleted(
        postId: string,
        tx: any = db,
    ): Promise<PostSelect | undefined> {
        const rows = await tx
            .select()
            .from(posts)
            .where(and(eq(posts.postId, postId), isNull(posts.deletedAt)))
            .limit(1);
        return rows[0];
    }

    async update(
        postId: string,
        data: Partial<Omit<PostInsert, "version">> & {
            version?: { increment: 1 };
        },
        tx: any = db,
    ): Promise<PostSelect> {
        const { version: _v, ...rest } = data as Partial<PostInsert> & {
            version?: { increment: 1 };
        };
        const set: Record<string, unknown> = {
            ...rest,
            updatedAt: new Date(),
        };
        if (_v?.increment === 1) {
            set.version = sql`${posts.version} + 1`;
        }
        const rows = await tx
            .update(posts)
            .set(set)
            .where(eq(posts.postId, postId))
            .returning();
        return rows[0]!;
    }

    async setDeletedAtAndIncrementVersion(
        postId: string,
        deletedAt: Date,
        tx: any = db,
    ): Promise<PostSelect> {
        const rows = await tx
            .update(posts)
            .set({
                deletedAt,
                updatedAt: new Date(),
                version: sql`${posts.version} + 1`,
            })
            .where(eq(posts.postId, postId))
            .returning();
        return rows[0]!;
    }
}
