import { ConfigService } from '@nestjs/config';
import type { MediaKind } from '../payload/request/upload-media.request';
import { MediaRepository } from '../repository/media.repository';
import { MinioService } from './minio.service';
export declare class MediaService {
    private readonly repo;
    private readonly minio;
    private readonly config;
    private readonly maxUploadSizeBytes;
    constructor(repo: MediaRepository, minio: MinioService, config: ConfigService);
    uploadMultipart(params: {
        ownerUserId: string;
        kind: MediaKind;
        file: Express.Multer.File;
    }): Promise<{
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
    getById(mediaId: string): Promise<{
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
    deleteById(params: {
        mediaId: string;
        requesterUserId: string;
    }): Promise<{
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
    deleteByOwnerUserId(ownerUserId: string): Promise<void>;
    getDownloadUrl(mediaId: string): Promise<string>;
    presignUpload(params: {
        ownerUserId: string;
        originalFilename: string;
        mimeType: string;
        kind: MediaKind;
    }): Promise<{
        entity: {
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
        };
        uploadUrl: string;
    }>;
}
