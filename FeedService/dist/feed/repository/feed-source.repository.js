"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedSourceRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db/db");
const schema_1 = require("../../db/schema");
let FeedSourceRepository = class FeedSourceRepository {
    async addSource(ownerUserId, sourceType, sourceId, createdAt, tx = db_1.db) {
        await tx
            .insert(schema_1.feed_sources)
            .values({
            ownerUserId,
            sourceType,
            sourceId,
            createdAt,
        })
            .onConflictDoNothing({
            target: [
                schema_1.feed_sources.ownerUserId,
                schema_1.feed_sources.sourceType,
                schema_1.feed_sources.sourceId,
            ],
        });
    }
    async removeSource(ownerUserId, sourceType, sourceId, tx = db_1.db) {
        await tx
            .delete(schema_1.feed_sources)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feed_sources.ownerUserId, ownerUserId), (0, drizzle_orm_1.eq)(schema_1.feed_sources.sourceType, sourceType), (0, drizzle_orm_1.eq)(schema_1.feed_sources.sourceId, sourceId)));
    }
    async deleteByOwnerUserId(ownerUserId, tx = db_1.db) {
        await tx.delete(schema_1.feed_sources).where((0, drizzle_orm_1.eq)(schema_1.feed_sources.ownerUserId, ownerUserId));
    }
    async findOwnersBySource(sourceType, sourceId, tx = db_1.db) {
        const rows = await tx
            .select({
            ownerUserId: schema_1.feed_sources.ownerUserId,
        })
            .from(schema_1.feed_sources)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feed_sources.sourceType, sourceType), (0, drizzle_orm_1.eq)(schema_1.feed_sources.sourceId, sourceId)));
        return rows.map((r) => r.ownerUserId);
    }
};
exports.FeedSourceRepository = FeedSourceRepository;
exports.FeedSourceRepository = FeedSourceRepository = __decorate([
    (0, common_1.Injectable)()
], FeedSourceRepository);
//# sourceMappingURL=feed-source.repository.js.map