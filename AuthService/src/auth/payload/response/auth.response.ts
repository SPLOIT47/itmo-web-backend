import type {UserPayload} from "../UserPayload";
import {ApiProperty} from "@nestjs/swagger";

export class AuthResponse {

    @ApiProperty()
    user: UserPayload;

    @ApiProperty()
    accessToken: string;
}