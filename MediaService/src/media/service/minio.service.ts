import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('minio.endpoint', { infer: true })!;
    const port = this.config.get<number>('minio.port', { infer: true })!;
    const useSSL = this.config.get<boolean>('minio.useSSL', { infer: true })!;
    const accessKey = this.config.get<string>('minio.accessKey', { infer: true })!;
    const secretKey = this.config.get<string>('minio.secretKey', { infer: true })!;

    this.bucket = this.config.get<string>('minio.bucket', { infer: true })!;
    this.client = new Client({ endPoint: endpoint, port, useSSL, accessKey, secretKey });
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      this.logger.warn(`Bucket "${this.bucket}" does not exist. Creating...`);
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Bucket "${this.bucket}" created`);
    }
  }

  getBucket(): string {
    return this.bucket;
  }

  async uploadObject(params: {
    bucket: string;
    objectKey: string;
    body: Buffer;
    size: number;
    mimeType: string;
  }) {
    await this.client.putObject(params.bucket, params.objectKey, params.body, params.size, {
      'Content-Type': params.mimeType,
    });
  }

  async removeObject(params: { bucket: string; objectKey: string }) {
    await this.client.removeObject(params.bucket, params.objectKey);
  }

  async statObject(params: { bucket: string; objectKey: string }) {
    return await this.client.statObject(params.bucket, params.objectKey);
  }

  async getPresignedDownloadUrl(params: { bucket: string; objectKey: string; expiresSeconds?: number }) {
    const expires = params.expiresSeconds ?? 60 * 10;
    return await this.client.presignedGetObject(params.bucket, params.objectKey, expires);
  }

  async getPresignedUploadUrl(params: {
    bucket: string;
    objectKey: string;
    expiresSeconds?: number;
    contentType?: string;
  }) {
    const expires = params.expiresSeconds ?? 60 * 10;
    // MinIO client doesn't enforce Content-Type here; clients should still set it on PUT.
    return await this.client.presignedPutObject(params.bucket, params.objectKey, expires);
  }
}

