import {date, index, integer, pgTable, text, timestamp, uuid, varchar} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
    userId: uuid("user_id").primaryKey(),
    identityVersion: integer("identity_version").notNull().default(0),
    login: varchar("login", { length: 50 }).unique(),
    name: varchar("name", { length: 50 }).notNull(),
    surname: varchar("surname", { length: 50 }).notNull(),
    bio: text("bio"),
    birthday: date("birthday"),
    city: varchar("city", { length: 256 }),
    education: text("education"),
    languages: text("languages").array(),
    avatarUrl: varchar("avatar_url", {length: 2048 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow()
        .$onUpdate(() => new Date()).notNull(),
});

export const inbox_events = pgTable("inbox_events", {
    eventId: uuid("event_id").primaryKey(),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    version: integer("version").notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    eventType: varchar("event_type", { length: 256 }).notNull(),
}, (t) => ({
    aggregateIndex: index("inbox_events_aggregate_id_idx").on(t.aggregateId),
    aggregateVersionIndex: index("inbox_events_aggregate_id_version_idx").on(t.aggregateId, t.version)
}));