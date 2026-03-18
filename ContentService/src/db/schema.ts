import {
    index,
    integer,
    jsonb,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

export const posts = pgTable(
    "posts",
    {
        postId: uuid("post_id").primaryKey().defaultRandom(),
        authorId: uuid("author_id").notNull(),
        text: text("text").notNull(),
        media: text("media").array().notNull().default([]),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
        deletedAt: timestamp("deleted_at"),
        version: integer("version").notNull().default(0),
    },
    (t) => ({
        authorCreatedIdx: index("posts_author_id_created_at_idx").on(
            t.authorId,
            t.createdAt,
        ),
    }),
);

export const comments = pgTable(
    "comments",
    {
        commentId: uuid("comment_id").primaryKey().defaultRandom(),
        postId: uuid("post_id").notNull(),
        authorId: uuid("author_id").notNull(),
        text: text("text").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        deletedAt: timestamp("deleted_at"),
        version: integer("version").notNull().default(0),
    },
    (t) => ({
        postCreatedIdx: index("comments_post_id_created_at_idx").on(
            t.postId,
            t.createdAt,
        ),
        authorCreatedIdx: index("comments_author_id_created_at_idx").on(
            t.authorId,
            t.createdAt,
        ),
    }),
);

export const likes = pgTable(
    "likes",
    {
        postId: uuid("post_id").notNull(),
        userId: uuid("user_id").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        version: integer("version").notNull().default(0),
    },
    (t) => [
        primaryKey({ columns: [t.postId, t.userId] }),
        index("likes_user_id_created_at_idx").on(t.userId, t.createdAt),
    ],
);

export const outbox_events = pgTable(
    "outbox_events",
    {
        outboxEventId: uuid("outbox_event_id").primaryKey().defaultRandom(),
        eventType: varchar("event_type", { length: 64 }).notNull(),
        payload: jsonb("payload").notNull(),
        status: varchar("status", { length: 32 }).notNull().default("NEW"),
        attempts: integer("attempts").notNull().default(0),
        lastError: text("last_error"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        sentAt: timestamp("sent_at"),
    },
    (t) => ({
        statusCreatedIdx: index("outbox_events_status_created_at_idx").on(
            t.status,
            t.createdAt,
        ),
    }),
);
