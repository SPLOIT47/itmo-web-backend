"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feed_sources = exports.inbox_events = exports.feed_items = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.feed_items = (0, pg_core_1.pgTable)("feed_items", {
    feedItemId: (0, pg_core_1.uuid)("feed_item_id").primaryKey().defaultRandom(),
    ownerUserId: (0, pg_core_1.uuid)("owner_user_id").notNull(),
    postId: (0, pg_core_1.uuid)("post_id").notNull(),
    authorType: (0, pg_core_1.varchar)("author_type", { length: 32 }).notNull(),
    authorId: (0, pg_core_1.uuid)("author_id").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: false }).notNull(),
    rankTime: (0, pg_core_1.timestamp)("rank_time", { withTimezone: false }).notNull(),
    payload: (0, pg_core_1.jsonb)("payload").notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deleted_at", { withTimezone: false }),
}, (t) => ({
    ownerRankIdx: (0, pg_core_1.index)("feed_items_owner_rank_idx").on(t.ownerUserId, t.rankTime),
    postIdx: (0, pg_core_1.index)("feed_items_post_idx").on(t.postId),
    authorIdx: (0, pg_core_1.index)("feed_items_author_idx").on(t.authorType, t.authorId),
}));
exports.inbox_events = (0, pg_core_1.pgTable)("inbox_events", {
    eventId: (0, pg_core_1.uuid)("event_id").primaryKey(),
    aggregateId: (0, pg_core_1.uuid)("aggregate_id").notNull(),
    version: (0, pg_core_1.integer)("version").notNull(),
    eventType: (0, pg_core_1.varchar)("event_type", { length: 128 }).notNull(),
    receivedAt: (0, pg_core_1.timestamp)("received_at", {
        withTimezone: false,
    })
        .defaultNow()
        .notNull(),
}, (t) => ({
    aggregateVersionUidx: (0, pg_core_1.uniqueIndex)("inbox_events_aggregate_version_uidx").on(t.aggregateId, t.version),
    aggregateIdx: (0, pg_core_1.index)("inbox_events_aggregate_idx").on(t.aggregateId),
}));
exports.feed_sources = (0, pg_core_1.pgTable)("feed_sources", {
    ownerUserId: (0, pg_core_1.uuid)("owner_user_id").notNull(),
    sourceType: (0, pg_core_1.varchar)("source_type", { length: 32 }).notNull(),
    sourceId: (0, pg_core_1.uuid)("source_id").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: false }).notNull(),
}, (t) => ({
    ownerSourceUidx: (0, pg_core_1.uniqueIndex)("feed_sources_owner_source_uidx").on(t.ownerUserId, t.sourceType, t.sourceId),
    ownerIdx: (0, pg_core_1.index)("feed_sources_owner_idx").on(t.ownerUserId),
    sourceIdx: (0, pg_core_1.index)("feed_sources_source_idx").on(t.sourceType, t.sourceId),
}));
//# sourceMappingURL=schema.js.map