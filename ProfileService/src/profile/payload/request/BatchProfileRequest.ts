import { IsArray, ArrayNotEmpty, IsUUID } from "class-validator";

export class BatchProfilesRequest {

    @IsArray()
    @ArrayNotEmpty()
    @IsUUID()
    ids: string[];
}