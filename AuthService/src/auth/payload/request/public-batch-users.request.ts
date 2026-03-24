import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsUUID } from "class-validator";

export class PublicBatchUserIdsRequest {
    @ApiProperty({ type: [String], maxItems: 100 })
    @IsArray()
    @ArrayMaxSize(100)
    @IsUUID("4", { each: true })
    ids!: string[];
}
