import type { schema } from '../../db';
import { MediaFileResponse } from '../payload/response/media-file.response';

export type MediaFileEntity = typeof schema.mediaFiles.$inferSelect;

export class MediaMapper {
  static toResponse(entity: MediaFileEntity, url?: string): MediaFileResponse {
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

