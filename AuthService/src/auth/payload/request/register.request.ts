import {IsEmail, IsNotEmpty, MaxLength} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class RegisterRequest {

    @ApiProperty()
    @IsNotEmpty()
    @MaxLength(50)
    login: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    password: string;

    @ApiProperty()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @MaxLength(50)
    surname: string;
}