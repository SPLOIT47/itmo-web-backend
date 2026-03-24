import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { MediaKind } from '../payload/request/upload-media.request';
import { MediaRepository } from '../repository/media.repository';
import { MinioService } from './minio.service';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'file';
  return base
    .normalize('NFKD')
    .replace(/[^\w.\-()+]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 200);
}

@Injectable()
export class MediaService {
  private readonly maxUploadSizeBytes: number;
  private readonly log = new Logger(MediaService.name);

  constructor(
    private readonly repo: MediaRepository,
    private readonly minio: MinioService,
    private readonly config: ConfigService,
  ) {
    this.maxUploadSizeBytes = this.config.get<number>('upload.maxSizeBytes', { infer: true })!;
  }

  async uploadMultipart(params: { ownerUserId: string; kind: MediaKind; file: Express.Multer.File }) {
    if (!params.file) {
      throw new BadRequestException('file is required');
    }
    if (!ALLOWED_MIME_TYPES.has(params.file.mimetype)) {
      throw new BadRequestException(`Unsupported mimeType: ${params.file.mimetype}`);
    }
    if (params.file.size <= 0) {
      throw new BadRequestException('Empty file');
    }
    if (params.file.size > this.maxUploadSizeBytes) {
      throw new BadRequestException(`File is too large. Max: ${this.maxUploadSizeBytes} bytes`);
    }

    const bucket = this.minio.getBucket();
    const safeName = sanitizeFilename(params.file.originalname);
    const objectKey = `${params.ownerUserId}/${params.kind}/${randomUUID()}-${safeName}`;

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

  async getById(mediaId: string) {
    const entity = await this.repo.findById(mediaId);
    if (!entity) throw new NotFoundException('Media file not found');
    return entity;
  }

  async deleteById(params: { mediaId: string; requesterUserId: string }) {
    const entity = await this.repo.findById(params.mediaId);
    if (!entity) throw new NotFoundException('Media file not found');
    if (entity.ownerUserId !== params.requesterUserId) {
      throw new ForbiddenException('Only owner can delete media');
    }

    await this.minio.removeObject({ bucket: entity.bucket, objectKey: entity.objectKey });
    await this.repo.softDelete(entity.mediaId);
    return entity;
  }

  async deleteByOwnerUserId(ownerUserId: string): Promise<void> {
    const entities = await this.repo.findActiveByOwnerUserId(ownerUserId);

    for (const entity of entities) {
      await this.minio.removeObject({
        bucket: entity.bucket,
        objectKey: entity.objectKey,
      });
      await this.repo.softDelete(entity.mediaId);
    }
  }

  async getDownloadUrl(mediaId: string) {
    const entity = await this.repo.findById(mediaId);
    if (!entity) throw new NotFoundException('Media file not found');
    return await this.minio.getPresignedDownloadUrl({ bucket: entity.bucket, objectKey: entity.objectKey });
  }

  async getDownloadStream(mediaId: string): Promise<{
    stream: NodeJS.ReadableStream;
    mimeType: string;
    originalFilename: string;
    sizeBytes: number;
  }> {
    const entity = await this.repo.findById(mediaId);
    if (!entity) throw new NotFoundException('Media file not found');
    this.log.log(
      `download mediaId=${mediaId} bucket=${entity.bucket} objectKey=${entity.objectKey} mime=${entity.mimeType} size=${entity.sizeBytes}`,
    );
    const stream = await this.minio.getObjectStream({
      bucket: entity.bucket,
      objectKey: entity.objectKey,
    });
    return {
      stream,
      mimeType: entity.mimeType,
      originalFilename: entity.originalFilename,
      sizeBytes: entity.sizeBytes,
    };
  }

  async presignUpload(params: { ownerUserId: string; originalFilename: string; mimeType: string; kind: MediaKind }) {
    if (!ALLOWED_MIME_TYPES.has(params.mimeType)) {
      throw new BadRequestException(`Unsupported mimeType: ${params.mimeType}`);
    }

    const bucket = this.minio.getBucket();
    const safeName = sanitizeFilename(params.originalFilename);
    const objectKey = `${params.ownerUserId}/${params.kind}/${randomUUID()}-${safeName}`;

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
}

