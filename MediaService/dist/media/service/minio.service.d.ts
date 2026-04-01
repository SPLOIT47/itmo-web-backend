import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class MinioService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private readonly client;
    private readonly bucket;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    getBucket(): string;
    uploadObject(params: {
        bucket: string;
        objectKey: string;
        body: Buffer;
        size: number;
        mimeType: string;
    }): Promise<void>;
    removeObject(params: {
        bucket: string;
        objectKey: string;
    }): Promise<void>;
    statObject(params: {
        bucket: string;
        objectKey: string;
    }): Promise<import("minio").BucketItemStat>;
    getPresignedDownloadUrl(params: {
        bucket: string;
        objectKey: string;
        expiresSeconds?: number;
    }): Promise<string>;
    getPresignedUploadUrl(params: {
        bucket: string;
        objectKey: string;
        expiresSeconds?: number;
        contentType?: string;
    }): Promise<string>;
}
