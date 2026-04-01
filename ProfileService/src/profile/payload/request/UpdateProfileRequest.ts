import { Transform } from "class-transformer";
import { IsArray, IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProfileRequest {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    surname?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @IsOptional()
    @Transform(({ value }) =>
        value === "" || value === null ? undefined : value,
    )
    @IsDateString()
    birthday?: string;

    @IsOptional()
    @IsString()
    @MaxLength(256)
    city?: string;

    @IsOptional()
    @IsString()
    education?: string;

    @IsOptional()
    @IsArray()
    languages?: string[];

    @IsOptional()
    @IsString()
    avatarUrl?: string;
}