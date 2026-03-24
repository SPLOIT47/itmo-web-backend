"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db/db");
const schema_1 = require("../../db/schema");
let FeedRepository = class FeedRepository {
    async findFeedForUser(ownerUserId, limit, offset, tx = db_1.db) {
        return tx
            .select()
            .from(schema_1.feed_items)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feed_items.ownerUserId, ownerUserId), (0, drizzle_orm_1.isNull)(schema_1.feed_items.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.feed_items.rankTime))
            .limit(limit)
            .offset(offset);
    }
    async insertMany(items, tx = db_1.db) {
        if (!items.length)
            return;
        await tx.insert(schema_1.feed_items).values(items);
    }
    async findExistingPostIdsForOwner(ownerUserId, postIds, tx = db_1.db) {
        if (postIds.length === 0) {
            return new Set();
        }
        const rows = await tx
            .select({ postId: schema_1.feed_items.postId })
            .from(schema_1.feed_items)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feed_items.ownerUserId, ownerUserId), (0, drizzle_orm_1.inArray)(schema_1.feed_items.postId, postIds), (0, drizzle_orm_1.isNull)(schema_1.feed_items.deletedAt)));
        return new Set(rows.map((r) => r.postId));
    }
    async trimFeedForOwner(ownerUserId, maxSize, tx = db_1.db) {
        const rows = await tx
            .select({
            rankTime: schema_1.feed_items.rankTime,
        })
            .from(schema_1.feed_items)
            .where((0, drizzle_orm_1.eq)(schema_1.feed_items.ownerUserId, ownerUserId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.feed_items.rankTime))
            .offset(maxSize)
            .limit(1);
        const threshold = rows[0]?.rankTime;
        if (!threshold)
            return;
        await tx
            .update(schema_1.feed_items)
            .set({
            deletedAt: (0, drizzle_orm_1.sql) `now()`,
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feed_items.ownerUserId, ownerUserId), (0, drizzle_orm_1.lt)(schema_1.feed_items.rankTime, threshold), (0, drizzle_orm_1.isNull)(schema_1.feed_items.deletedAt)));
    }
    async updatePayloadByPostId(postId, payload, tx = db_1.db) {
        await tx
            .update(schema_1.feed_items)
            .set({ payload })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feed_items.postId, postId), (0, drizzle_orm_1.isNull)(schema_1.feed_items.deletedAt)));
    }
    async softDeleteByPostId(postId, tx = db_1.db) {
        await tx
            .update(schema_1.feed_items)
            .set({ deletedAt: (0, drizzle_orm_1.sql) `now()` })
            .where((0, drizzle_orm_1.eq)(schema_1.feed_items.postId, postId));
    }
    async getPayloadByPostId(postId, tx = db_1.db) {
        const rows = await tx
            .select({ payload: schema_1.feed_items.payload })
            .from(schema_1.feed_items)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feed_items.postId, postId), (0, drizzle_orm_1.isNull)(schema_1.feed_items.deletedAt)))
            .limit(1);
        return (rows[0]?.payload ?? null);
    }
    async findCommunityPosts(ownerUserId, communityId, limit, offset, tx = db_1.db) {
        const fetchSize = limit + offset + 50;
        const rows = await tx
            .select()
            .from(schema_1.feed_items)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feed_items.ownerUserId, ownerUserId), (0, drizzle_orm_1.eq)(schema_1.feed_items.authorType, "community"), (0, drizzle_orm_1.eq)(schema_1.feed_items.authorId, communityId), (0, drizzle_orm_1.isNull)(schema_1.feed_items.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.feed_items.rankTime))
            .limit(fetchSize);
        const seen = new Set();
        const unique = [];
        for (const row of rows) {
            if (seen.has(row.postId))
                continue;
            seen.add(row.postId);
            unique.push(row);
        }
        const sliced = unique.slice(offset, offset + limit);
        return sliced.map((r) => ({
            postId: r.postId,
            authorType: r.authorType,
            authorId: r.authorId,
            createdAt: r.createdAt,
            payload: r.payload,
        }));
    }
    async deleteByOwnerUserId(ownerUserId, tx = db_1.db) {
        await tx
            .update(schema_1.feed_items)
            .set({ deletedAt: (0, drizzle_orm_1.sql) `now()` })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feed_items.ownerUserId, ownerUserId), (0, drizzle_orm_1.isNull)(schema_1.feed_items.deletedAt)));
    }
    async deleteByOwnerAndAuthor(ownerUserId, authorType, authorId, tx = db_1.db) {
        await tx
            .update(schema_1.feed_items)
            .set({ deletedAt: (0, drizzle_orm_1.sql) `now()` })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feed_items.ownerUserId, ownerUserId), (0, drizzle_orm_1.eq)(schema_1.feed_items.authorType, authorType), (0, drizzle_orm_1.eq)(schema_1.feed_items.authorId, authorId), (0, drizzle_orm_1.isNull)(schema_1.feed_items.deletedAt)));
    }
};
exports.FeedRepository = FeedRepository;
exports.FeedRepository = FeedRepository = __decorate([
    (0, common_1.Injectable)()
], FeedRepository);
//# sourceMappingURL=feed.repository.js.map