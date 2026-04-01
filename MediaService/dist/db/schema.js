"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaFiles = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.mediaFiles = (0, pg_core_1.pgTable)('media_files', {
    mediaId: (0, pg_core_1.uuid)('media_id').primaryKey().defaultRandom(),
    ownerUserId: (0, pg_core_1.uuid)('owner_user_id').notNull(),
    bucket: (0, pg_core_1.varchar)('bucket', { length: 255 }).notNull(),
    objectKey: (0, pg_core_1.varchar)('object_key', { length: 1024 }).notNull().unique(),
    originalFilename: (0, pg_core_1.varchar)('original_filename', { length: 1024 }).notNull(),
    mimeType: (0, pg_core_1.varchar)('mime_type', { length: 255 }).notNull(),
    sizeBytes: (0, pg_core_1.bigint)('size_bytes', { mode: 'number' }).notNull(),
    kind: (0, pg_core_1.varchar)('kind', { length: 64 }).notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: false }).notNull().default((0, drizzle_orm_1.sql) `now()`),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at', { withTimezone: false }),
    version: (0, pg_core_1.integer)('version').notNull().default(0),
}, (t) => ({
    ownerCreatedAtIdx: (0, pg_core_1.index)('media_files_owner_user_id_created_at_idx').on(t.ownerUserId, t.createdAt),
}));
