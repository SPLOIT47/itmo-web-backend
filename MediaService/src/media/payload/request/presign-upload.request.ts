import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length } from 'class-validator';
import { MEDIA_KINDS, type MediaKind } from './upload-media.request';

export class PresignUploadRequest {
  @ApiProperty({ example: 'photo.png' })
  @IsString()
  @Length(1, 1024)
  originalFilename!: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  @Length(1, 255)
  mimeType!: string;

  @ApiProperty({ example: 'avatar', enum: MEDIA_KINDS })
  @IsString()
  @IsIn([...MEDIA_KINDS])
  kind!: MediaKind;
}

