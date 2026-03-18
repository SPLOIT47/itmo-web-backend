import { Module } from '@nestjs/common';
import { MediaController } from './controller/media.controller';
import { MediaRepository } from './repository/media.repository';
import { MediaService } from './service/media.service';
import { MinioService } from './service/minio.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaRepository, MinioService],
})
export class MediaModule {}

