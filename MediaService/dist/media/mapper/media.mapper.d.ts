import type { schema } from '../../db';
import { MediaFileResponse } from '../payload/response/media-file.response';
export type MediaFileEntity = typeof schema.mediaFiles.$inferSelect;
export declare class MediaMapper {
    static toResponse(entity: MediaFileEntity, url?: string): MediaFileResponse;
}
