import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export const MEDIA_KINDS = [
  'avatar',
  'cover',
  'post-image',
  'community-avatar',
  'community-cover',
  'attachment',
  'other',
] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export class UploadMediaRequest {
  @ApiProperty({ example: 'avatar', enum: MEDIA_KINDS })
  @IsString()
  @IsIn([...MEDIA_KINDS])
  kind!: MediaKind;
}

