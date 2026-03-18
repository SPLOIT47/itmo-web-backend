import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { Database } from '../../db';
import { schema } from '../../db';

type Tx = any;

export type MediaFileEntity = typeof schema.mediaFiles.$inferSelect;
export type MediaFileInsert = typeof schema.mediaFiles.$inferInsert;

@Injectable()
export class MediaRepository {
  constructor(@Inject('DRIZZLE') private readonly db: Database) {}

  async findById(mediaId: string, dbLike: any = this.db): Promise<MediaFileEntity | null> {
    const rows = await dbLike
      .select()
      .from(schema.mediaFiles)
      .where(and(eq(schema.mediaFiles.mediaId, mediaId), isNull(schema.mediaFiles.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByIdIncludingDeleted(mediaId: string, dbLike: any = this.db): Promise<MediaFileEntity | null> {
    const rows = await dbLike.select().from(schema.mediaFiles).where(eq(schema.mediaFiles.mediaId, mediaId)).limit(1);
    return rows[0] ?? null;
  }

  async create(entity: Omit<MediaFileInsert, 'mediaId' | 'createdAt' | 'deletedAt' | 'version'>, tx: Tx = this.db) {
    const [row] = await tx.insert(schema.mediaFiles).values(entity).returning();
    return row as MediaFileEntity;
  }

  async softDelete(mediaId: string, tx: Tx = this.db) {
    const [row] = await tx
      .update(schema.mediaFiles)
      .set({ deletedAt: new Date(), version: sql`${schema.mediaFiles.version} + 1` })
      .where(and(eq(schema.mediaFiles.mediaId, mediaId), isNull(schema.mediaFiles.deletedAt)))
      .returning();
    return (row as MediaFileEntity) ?? null;
  }
}

