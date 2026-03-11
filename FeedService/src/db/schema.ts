import {
    index,
    integer,
    jsonb,
    pgTable,
    timestamp,
    uuid,
    varchar,
    uniqueIndex,
} from "drizzle-orm/pg-core";

export const feed_items = pgTable(
    "feed_items",
    {
        feedItemId: uuid("feed_item_id").primaryKey().defaultRandom(),
        ownerUserId: uuid("owner_user_id").notNull(),
        postId: uuid("post_id").notNull(),
        authorType: varchar("author_type", { length: 32 }).notNull(),
        authorId: uuid("author_id").notNull(),
        createdAt: timestamp("created_at", { withTimezone: false }).notNull(),
        rankTime: timestamp("rank_time", { withTimezone: false }).notNull(),
        payload: jsonb("payload").notNull(),
        deletedAt: timestamp("deleted_at", { withTimezone: false }),
    },
    (t) => ({
        ownerRankIdx: index("feed_items_owner_rank_idx").on(
            t.ownerUserId,
            t.rankTime,
        ),
        postIdx: index("feed_items_post_idx").on(t.postId),
        authorIdx: index("feed_items_author_idx").on(t.authorType, t.authorId),
    }),
);

export const inbox_events = pgTable(
    "inbox_events",
    {
        eventId: uuid("event_id").primaryKey(),
        aggregateId: uuid("aggregate_id").notNull(),
        version: integer("version").notNull(),
        eventType: varchar("event_type", { length: 128 }).notNull(),
        receivedAt: timestamp("received_at", {
            withTimezone: false,
        })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        aggregateVersionUidx: uniqueIndex(
            "inbox_events_aggregate_version_uidx",
        ).on(t.aggregateId, t.version),
        aggregateIdx: index("inbox_events_aggregate_idx").on(t.aggregateId),
    }),
);

export const feed_sources = pgTable(
    "feed_sources",
    {
        ownerUserId: uuid("owner_user_id").notNull(),
        sourceType: varchar("source_type", { length: 32 }).notNull(),
        sourceId: uuid("source_id").notNull(),
        createdAt: timestamp("created_at", { withTimezone: false }).notNull(),
    },
    (t) => ({
        ownerSourceUidx: uniqueIndex("feed_sources_owner_source_uidx").on(
            t.ownerUserId,
            t.sourceType,
            t.sourceId,
        ),
        ownerIdx: index("feed_sources_owner_idx").on(t.ownerUserId),
        sourceIdx: index("feed_sources_source_idx").on(
            t.sourceType,
            t.sourceId,
        ),
    }),
);

