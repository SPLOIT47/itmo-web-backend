import { ApiProperty } from '@nestjs/swagger';

export class MediaFileResponse {
  @ApiProperty({ format: 'uuid' })
  mediaId!: string;

  @ApiProperty({ format: 'uuid' })
  ownerUserId!: string;

  @ApiProperty()
  originalFilename!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty({ example: 12345 })
  sizeBytes!: number;

  @ApiProperty()
  kind!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ required: false })
  url?: string;
}

