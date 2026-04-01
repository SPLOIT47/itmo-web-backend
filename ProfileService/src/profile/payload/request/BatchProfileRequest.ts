import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class BatchProfilesRequest {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID("all", { each: true })
    ids: string[];
}