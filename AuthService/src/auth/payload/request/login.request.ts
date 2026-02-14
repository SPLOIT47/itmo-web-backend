import {IsNotEmpty} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class LoginRequest {

    @ApiProperty()
    @IsNotEmpty()
    identifier: string;

    @ApiProperty()
    @IsNotEmpty()
    password: string;
}