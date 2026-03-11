import {IsInt, IsOptional, IsString, Max, Min} from "class-validator";
import { Type } from "class-transformer";

export class SearchProfilesRequest {
    @IsString()
    q: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 20;
}