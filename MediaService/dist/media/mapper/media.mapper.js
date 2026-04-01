"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaMapper = void 0;
class MediaMapper {
    static toResponse(entity, url) {
        return {
            mediaId: entity.mediaId,
            ownerUserId: entity.ownerUserId,
            originalFilename: entity.originalFilename,
            mimeType: entity.mimeType,
            sizeBytes: entity.sizeBytes,
            kind: entity.kind,
            createdAt: entity.createdAt,
            url,
        };
    }
}
exports.MediaMapper = MediaMapper;
