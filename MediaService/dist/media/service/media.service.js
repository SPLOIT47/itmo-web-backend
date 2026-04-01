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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const media_repository_1 = require("../repository/media.repository");
const minio_service_1 = require("./minio.service");
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
function sanitizeFilename(name) {
    const base = name.split(/[/\\]/).pop() ?? 'file';
    return base
        .normalize('NFKD')
        .replace(/[^\w.\-()+]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 200);
}
let MediaService = class MediaService {
    repo;
    minio;
    config;
    maxUploadSizeBytes;
    constructor(repo, minio, config) {
        this.repo = repo;
        this.minio = minio;
        this.config = config;
        this.maxUploadSizeBytes = this.config.get('upload.maxSizeBytes', { infer: true });
    }
    async uploadMultipart(params) {
        if (!params.file) {
            throw new common_1.BadRequestException('file is required');
        }
        if (!ALLOWED_MIME_TYPES.has(params.file.mimetype)) {
            throw new common_1.BadRequestException(`Unsupported mimeType: ${params.file.mimetype}`);
        }
        if (params.file.size <= 0) {
            throw new common_1.BadRequestException('Empty file');
        }
        if (params.file.size > this.maxUploadSizeBytes) {
            throw new common_1.BadRequestException(`File is too large. Max: ${this.maxUploadSizeBytes} bytes`);
        }
        const bucket = this.minio.getBucket();
        const safeName = sanitizeFilename(params.file.originalname);
        const objectKey = `${params.ownerUserId}/${params.kind}/${(0, crypto_1.randomUUID)()}-${safeName}`;
        await this.minio.uploadObject({
            bucket,
            objectKey,
            body: params.file.buffer,
            size: params.file.size,
            mimeType: params.file.mimetype,
        });
        const entity = await this.repo.create({
            ownerUserId: params.ownerUserId,
            bucket,
            objectKey,
            originalFilename: params.file.originalname,
            mimeType: params.file.mimetype,
            sizeBytes: params.file.size,
            kind: params.kind,
            metadata: null,
        });
        return entity;
    }
    async getById(mediaId) {
        const entity = await this.repo.findById(mediaId);
        if (!entity)
            throw new common_1.NotFoundException('Media file not found');
        return entity;
    }
    async deleteById(params) {
        const entity = await this.repo.findById(params.mediaId);
        if (!entity)
            throw new common_1.NotFoundException('Media file not found');
        if (entity.ownerUserId !== params.requesterUserId) {
            throw new common_1.ForbiddenException('Only owner can delete media');
        }
        await this.minio.removeObject({ bucket: entity.bucket, objectKey: entity.objectKey });
        await this.repo.softDelete(entity.mediaId);
        return entity;
    }
    async deleteByOwnerUserId(ownerUserId) {
        const entities = await this.repo.findActiveByOwnerUserId(ownerUserId);
        for (const entity of entities) {
            await this.minio.removeObject({
                bucket: entity.bucket,
                objectKey: entity.objectKey,
            });
            await this.repo.softDelete(entity.mediaId);
        }
    }
    async getDownloadUrl(mediaId) {
        const entity = await this.repo.findById(mediaId);
        if (!entity)
            throw new common_1.NotFoundException('Media file not found');
        return await this.minio.getPresignedDownloadUrl({ bucket: entity.bucket, objectKey: entity.objectKey });
    }
    async presignUpload(params) {
        if (!ALLOWED_MIME_TYPES.has(params.mimeType)) {
            throw new common_1.BadRequestException(`Unsupported mimeType: ${params.mimeType}`);
        }
        const bucket = this.minio.getBucket();
        const safeName = sanitizeFilename(params.originalFilename);
        const objectKey = `${params.ownerUserId}/${params.kind}/${(0, crypto_1.randomUUID)()}-${safeName}`;
        const uploadUrl = await this.minio.getPresignedUploadUrl({ bucket, objectKey });
        const entity = await this.repo.create({
            ownerUserId: params.ownerUserId,
            bucket,
            objectKey,
            originalFilename: params.originalFilename,
            mimeType: params.mimeType,
            sizeBytes: 0,
            kind: params.kind,
            metadata: null,
        });
        return { entity, uploadUrl };
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [media_repository_1.MediaRepository,
        minio_service_1.MinioService,
        config_1.ConfigService])
], MediaService);
