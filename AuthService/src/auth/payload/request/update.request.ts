import {ApiProperty} from "@nestjs/swagger";
import {IsEmail, IsOptional, IsString} from "class-validator";

export class UpdateCredentialsRequest {

    @ApiProperty()
    @IsOptional()
    @IsString()
    login?: string;

    @ApiProperty()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    currentPassword?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    newPassword?: string;
}