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
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const id_annotation_1 = require("../../common/annotation/id.annotation");
const media_mapper_1 = require("../mapper/media.mapper");
const presign_upload_request_1 = require("../payload/request/presign-upload.request");
const upload_media_request_1 = require("../payload/request/upload-media.request");
const media_file_response_1 = require("../payload/response/media-file.response");
const presign_upload_response_1 = require("../payload/response/presign-upload.response");
const presigned_url_response_1 = require("../payload/response/presigned-url.response");
const media_service_1 = require("../service/media.service");
const MAX_MULTER_FILE_SIZE = (() => {
    const raw = process.env.MAX_UPLOAD_SIZE_BYTES;
    const n = raw ? Number(raw) : 10 * 1024 * 1024;
    return Number.isFinite(n) && n > 0 ? n : 10 * 1024 * 1024;
})();
let MediaController = class MediaController {
    media;
    constructor(media) {
        this.media = media;
    }
    async upload(ownerUserId, body, file) {
        const entity = await this.media.uploadMultipart({ ownerUserId, kind: body.kind, file });
        return media_mapper_1.MediaMapper.toResponse(entity);
    }
    async getById(id) {
        const entity = await this.media.getById(id);
        return media_mapper_1.MediaMapper.toResponse(entity);
    }
    async delete(requesterUserId, id) {
        const entity = await this.media.deleteById({ mediaId: id, requesterUserId });
        return media_mapper_1.MediaMapper.toResponse(entity);
    }
    async getUrl(id) {
        const url = await this.media.getDownloadUrl(id);
        return { url };
    }
    async deleteMe(userId) {
        await this.media.deleteByOwnerUserId(userId);
    }
    async presignUpload(ownerUserId, body) {
        const { entity, uploadUrl } = await this.media.presignUpload({
            ownerUserId,
            originalFilename: body.originalFilename,
            mimeType: body.mimeType,
            kind: body.kind,
        });
        return { mediaId: entity.mediaId, objectKey: entity.objectKey, uploadUrl };
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, swagger_1.ApiHeader)({ name: 'X-User-Id', required: true }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file', 'kind'],
            properties: {
                file: { type: 'string', format: 'binary' },
                kind: { type: 'string', example: 'avatar' },
            },
        },
    }),
    (0, swagger_1.ApiOkResponse)({ type: media_file_response_1.MediaFileResponse }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: MAX_MULTER_FILE_SIZE },
    })),
    __param(0, (0, id_annotation_1.Id)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upload_media_request_1.UploadMediaRequest, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid' }),
    (0, swagger_1.ApiOkResponse)({ type: media_file_response_1.MediaFileResponse }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getById", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiHeader)({ name: 'X-User-Id', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid' }),
    (0, swagger_1.ApiOkResponse)({ type: media_file_response_1.MediaFileResponse }),
    __param(0, (0, id_annotation_1.Id)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(':id/url'),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid' }),
    (0, swagger_1.ApiOkResponse)({ type: presigned_url_response_1.PresignedUrlResponse }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getUrl", null);
__decorate([
    (0, common_1.Delete)('me'),
    (0, swagger_1.ApiHeader)({ name: 'X-User-Id', required: true }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, id_annotation_1.Id)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "deleteMe", null);
__decorate([
    (0, common_1.Post)('presign-upload'),
    (0, swagger_1.ApiHeader)({ name: 'X-User-Id', required: true }),
    (0, swagger_1.ApiOkResponse)({ type: presign_upload_response_1.PresignUploadResponse }),
    __param(0, (0, id_annotation_1.Id)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, presign_upload_request_1.PresignUploadRequest]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "presignUpload", null);
exports.MediaController = MediaController = __decorate([
    (0, swagger_1.ApiTags)('media'),
    (0, common_1.Controller)('media'),
    __metadata("design:paramtypes", [media_service_1.MediaService])
], MediaController);
