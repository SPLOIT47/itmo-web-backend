import type { Database } from '../../db';
import { schema } from '../../db';
type Tx = any;
export type MediaFileEntity = typeof schema.mediaFiles.$inferSelect;
export type MediaFileInsert = typeof schema.mediaFiles.$inferInsert;
export declare class MediaRepository {
    private readonly db;
    constructor(db: Database);
    findById(mediaId: string, dbLike?: any): Promise<MediaFileEntity | null>;
    findByIdIncludingDeleted(mediaId: string, dbLike?: any): Promise<MediaFileEntity | null>;
    findActiveByOwnerUserId(ownerUserId: string, dbLike?: any): Promise<MediaFileEntity[]>;
    create(entity: Omit<MediaFileInsert, 'mediaId' | 'createdAt' | 'deletedAt' | 'version'>, tx?: Tx): Promise<{
        mediaId: string;
        ownerUserId: string;
        bucket: string;
        objectKey: string;
        originalFilename: string;
        mimeType: string;
        sizeBytes: number;
        kind: string;
        metadata: unknown;
        createdAt: Date;
        deletedAt: Date | null;
        version: number;
    }>;
    softDelete(mediaId: string, tx?: Tx): Promise<{
        mediaId: string;
        ownerUserId: string;
        bucket: string;
        objectKey: string;
        originalFilename: string;
        mimeType: string;
        sizeBytes: number;
        kind: string;
        metadata: unknown;
        createdAt: Date;
        deletedAt: Date | null;
        version: number;
    }>;
}
export {};
