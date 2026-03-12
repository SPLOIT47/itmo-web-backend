import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponse {
  @ApiProperty()
  url!: string;
}

