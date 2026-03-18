import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

class StatusDto {
  @ApiPropertyOptional({ enum: ['open', 'closed'] })
  @IsOptional()
  @IsString()
  @IsIn(['open', 'closed'])
  type?: 'open' | 'closed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  opensAt?: string;
}

class AddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  building?: string;
}

class ContactsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vk?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;
}

class LinkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}

export class UpdateCommunityDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: () => StatusDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StatusDto)
  status?: StatusDto;

  @ApiPropertyOptional({ type: () => AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ type: () => ContactsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactsDto)
  contacts?: ContactsDto;

  @ApiPropertyOptional({ type: () => [LinkDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  links?: LinkDto[];
}

