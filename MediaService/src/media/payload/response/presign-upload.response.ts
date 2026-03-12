import { ApiProperty } from '@nestjs/swagger';

export class PresignUploadResponse {
  @ApiProperty({ format: 'uuid' })
  mediaId!: string;

  @ApiProperty()
  objectKey!: string;

  @ApiProperty()
  uploadUrl!: string;
}

