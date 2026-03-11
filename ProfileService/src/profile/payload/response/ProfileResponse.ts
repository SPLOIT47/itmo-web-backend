import {ApiProperty} from "@nestjs/swagger";

export class ProfileResponse {

    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    surname: string;

    @ApiProperty({ required: false })
    bio?: string;

    @ApiProperty({ required: false })
    birthday?: string;

    @ApiProperty({ required: false })
    city?: string;

    @ApiProperty({ required: false })
    education?: string;

    @ApiProperty({ type: [String], required: false })
    languages?: string[];

    @ApiProperty({ required: false })
    avatarUrl?: string;

    @ApiProperty()
    createdAt: string;

    @ApiProperty()
    updatedAt: string;
}