"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
let MediaRepository = class MediaRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(mediaId, dbLike = this.db) {
        const rows = await dbLike
            .select()
            .from(db_1.schema.mediaFiles)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.mediaFiles.mediaId, mediaId), (0, drizzle_orm_1.isNull)(db_1.schema.mediaFiles.deletedAt)))
            .limit(1);
        return rows[0] ?? null;
    }
    async findByIdIncludingDeleted(mediaId, dbLike = this.db) {
        const rows = await dbLike.select().from(db_1.schema.mediaFiles).where((0, drizzle_orm_1.eq)(db_1.schema.mediaFiles.mediaId, mediaId)).limit(1);
        return rows[0] ?? null;
    }
    async findActiveByOwnerUserId(ownerUserId, dbLike = this.db) {
        return dbLike
            .select()
            .from(db_1.schema.mediaFiles)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.mediaFiles.ownerUserId, ownerUserId), (0, drizzle_orm_1.isNull)(db_1.schema.mediaFiles.deletedAt)));
    }
    async create(entity, tx = this.db) {
        const [row] = await tx.insert(db_1.schema.mediaFiles).values(entity).returning();
        return row;
    }
    async softDelete(mediaId, tx = this.db) {
        const [row] = await tx
            .update(db_1.schema.mediaFiles)
            .set({ deletedAt: new Date(), version: (0, drizzle_orm_1.sql) `${db_1.schema.mediaFiles.version} + 1` })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.schema.mediaFiles.mediaId, mediaId), (0, drizzle_orm_1.isNull)(db_1.schema.mediaFiles.deletedAt)))
            .returning();
        return row ?? null;
    }
};
exports.MediaRepository = MediaRepository;
exports.MediaRepository = MediaRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('DRIZZLE')),
    __metadata("design:paramtypes", [Object])
], MediaRepository);
