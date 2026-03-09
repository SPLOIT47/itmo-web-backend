import { ApiProperty } from "@nestjs/swagger";
import { ProfileResponse } from "./ProfileResponse";

export class MeProfileResponse {
    @ApiProperty({ enum: ["PENDING", "READY"] })
    status: "PENDING" | "READY";

    @ApiProperty({ required: false, type: ProfileResponse })
    profile?: ProfileResponse;
}