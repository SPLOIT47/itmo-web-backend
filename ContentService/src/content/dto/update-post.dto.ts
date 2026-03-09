import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdatePostDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    text?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    media?: string[];
}

