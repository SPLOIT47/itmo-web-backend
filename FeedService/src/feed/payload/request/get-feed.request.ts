import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class GetFeedQueryDto {
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset = 0;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit = 20;
}

