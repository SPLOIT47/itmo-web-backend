import { bigint, index, integer, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const mediaFiles = pgTable(
  'media_files',
  {
    mediaId: uuid('media_id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id').notNull(),
    bucket: varchar('bucket', { length: 255 }).notNull(),
    objectKey: varchar('object_key', { length: 1024 }).notNull().unique(),
    originalFilename: varchar('original_filename', { length: 1024 }).notNull(),
    mimeType: varchar('mime_type', { length: 255 }).notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    kind: varchar('kind', { length: 64 }).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().default(sql`now()`),
    deletedAt: timestamp('deleted_at', { withTimezone: false }),
    version: integer('version').notNull().default(0),
  },
  (t) => ({
    ownerCreatedAtIdx: index('media_files_owner_user_id_created_at_idx').on(t.ownerUserId, t.createdAt),
  }),
);

