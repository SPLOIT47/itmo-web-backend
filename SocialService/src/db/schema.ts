import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const communities = pgTable('communities', {
  communityId: uuid('community_id').primaryKey().defaultRandom(),
  ownerUserId: uuid('owner_user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description'),
  avatarUrl: varchar('avatar_url', { length: 1024 }),
  coverUrl: varchar('cover_url', { length: 1024 }),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().default(sql`now()`),
  deletedAt: timestamp('deleted_at', { withTimezone: false }),
  version: integer('version').notNull().default(1),
});

export const communityMembers = pgTable(
  'community_members',
  {
    communityId: uuid('community_id').notNull(),
    userId: uuid('user_id').notNull(),
    role: varchar('role', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().default(sql`now()`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.communityId, t.userId] }),
  }),
);

export const communityDetails = pgTable('community_details', {
  communityId: uuid('community_id').primaryKey(),
  shortDescription: text('short_description'),
  fullDescription: text('full_description'),
  tags: text('tags').array(),
  statusType: varchar('status_type', { length: 50 }),
  statusOpensAt: timestamp('status_opens_at', { withTimezone: false }),
  addressCity: varchar('address_city', { length: 255 }),
  addressStreet: varchar('address_street', { length: 255 }),
  addressBuilding: varchar('address_building', { length: 50 }),
  contactsEmail: varchar('contacts_email', { length: 255 }),
  contactsPhone: varchar('contacts_phone', { length: 50 }),
  contactsTelegram: varchar('contacts_telegram', { length: 255 }),
  contactsVk: varchar('contacts_vk', { length: 255 }),
  contactsWebsite: varchar('contacts_website', { length: 1024 }),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().default(sql`now()`),
});

export const communityLinks = pgTable('community_links', {
  linkId: uuid('link_id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  url: varchar('url', { length: 1024 }).notNull(),
  pinned: boolean('pinned').notNull().default(false),
  position: integer('position').notNull().default(0),
});

export const friendRequests = pgTable('friend_requests', {
  requestId: uuid('request_id').primaryKey().defaultRandom(),
  requesterUserId: uuid('requester_user_id').notNull(),
  targetUserId: uuid('target_user_id').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().default(sql`now()`),
});

export const friendships = pgTable(
  'friendships',
  {
    friendshipId: uuid('friendship_id').primaryKey().defaultRandom(),
    userA: uuid('user_a').notNull(),
    userB: uuid('user_b').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().default(sql`now()`),
    deletedAt: timestamp('deleted_at', { withTimezone: false }),
    version: integer('version').notNull().default(1),
  },
  (t) => ({
    uniqPair: uniqueIndex('friendships_user_a_user_b_uniq').on(t.userA, t.userB),
  }),
);

export const outboxEvents = pgTable('outbox_events', {
  outboxEventId: uuid('outbox_event_id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().default(sql`now()`),
  sentAt: timestamp('sent_at', { withTimezone: false }),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
});

