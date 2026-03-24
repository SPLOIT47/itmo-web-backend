import { ApiProperty } from "@nestjs/swagger";
import {
    IsArray,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    ValidateIf,
} from "class-validator";

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

    @ApiProperty({ required: false, enum: ["user", "community"] })
    @IsOptional()
    @IsIn(["user", "community"])
    postAuthorKind?: "user" | "community";

    @ApiProperty({ required: false, format: "uuid" })
    @ValidateIf((o: CreatePostDto) => o.postAuthorKind === "community")
    @IsUUID()
    communityId?: string;
}

