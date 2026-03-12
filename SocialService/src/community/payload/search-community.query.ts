import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchCommunityQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;
}

