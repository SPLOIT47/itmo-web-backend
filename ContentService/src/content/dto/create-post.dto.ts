import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, MaxLength } from "class-validator";

export class CreatePostDto {
    @ApiProperty()
    @IsString()
    @MaxLength(5000)
    text: string;

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    media?: string[];
}

