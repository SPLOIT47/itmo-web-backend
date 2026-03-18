import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class CreateCommentDto {
    @ApiProperty()
    @IsString()
    @MaxLength(2000)
    text: string;
}

