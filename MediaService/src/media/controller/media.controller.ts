import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiHeader, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { Id } from '../../common/annotation/id.annotation';
import { MediaMapper } from '../mapper/media.mapper';
import { PresignUploadRequest } from '../payload/request/presign-upload.request';
import { UploadMediaRequest } from '../payload/request/upload-media.request';
import { MediaFileResponse } from '../payload/response/media-file.response';
import { PresignUploadResponse } from '../payload/response/presign-upload.response';
import { PresignedUrlResponse } from '../payload/response/presigned-url.response';
import { MediaService } from '../service/media.service';

const MAX_MULTER_FILE_SIZE = (() => {
  const raw = process.env.MAX_UPLOAD_SIZE_BYTES;
  const n = raw ? Number(raw) : 10 * 1024 * 1024;
  return Number.isFinite(n) && n > 0 ? n : 10 * 1024 * 1024;
})();

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload')
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'kind'],
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: { type: 'string', example: 'avatar' },
      },
    },
  })
  @ApiOkResponse({ type: MediaFileResponse })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_MULTER_FILE_SIZE },
    }),
  )
  async upload(@Id() ownerUserId: string, @Body() body: UploadMediaRequest, @UploadedFile() file: Express.Multer.File) {
    const entity = await this.media.uploadMultipart({ ownerUserId, kind: body.kind, file });
    return MediaMapper.toResponse(entity);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: MediaFileResponse })
  async getById(@Param('id') id: string) {
    const entity = await this.media.getById(id);
    return MediaMapper.toResponse(entity);
  }

  @Delete(':id')
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: MediaFileResponse })
  async delete(@Id() requesterUserId: string, @Param('id') id: string) {
    const entity = await this.media.deleteById({ mediaId: id, requesterUserId });
    return MediaMapper.toResponse(entity);
  }

  @Get(':id/url')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PresignedUrlResponse })
  async getUrl(@Param('id') id: string): Promise<PresignedUrlResponse> {
    const url = await this.media.getDownloadUrl(id);
    return { url };
  }

  @Post('presign-upload')
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiOkResponse({ type: PresignUploadResponse })
  async presignUpload(
    @Id() ownerUserId: string,
    @Body() body: PresignUploadRequest,
  ): Promise<PresignUploadResponse> {
    const { entity, uploadUrl } = await this.media.presignUpload({
      ownerUserId,
      originalFilename: body.originalFilename,
      mimeType: body.mimeType,
      kind: body.kind,
    });

    return { mediaId: entity.mediaId, objectKey: entity.objectKey, uploadUrl };
  }
}

