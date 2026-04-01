import {Body, Controller, Delete, Get, Param, Patch, Post, Query, HttpCode, HttpStatus} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {ProfileResponse} from "../payload/response/ProfileResponse";
import {SearchProfilesResponse} from "../payload/response/SearchProfileResponse";
import {Id} from "../annotation/id.annotation";
import {BatchProfilesResponse} from "../payload/response/BatchProfileResponse";
import {BatchProfilesRequest} from "../payload/request/BatchProfileRequest";
import {UpdateProfileRequest} from "../payload/request/UpdateProfileRequest";
import {ProfileService} from "../service/profile.service";
import {SearchProfilesRequest} from "../payload/request/SearchProfileRequest";
import {MeProfileResponse} from "../payload/response/MeProfileResponse";

@ApiTags("Profiles")
@Controller("profiles")
export class ProfileController {

    constructor(private readonly service: ProfileService) {}

    @Get("search")
    async findProfile(@Query() query: SearchProfilesRequest): Promise<SearchProfilesResponse> {
        return await this.service.findProfile(query);
    }

    @Get("me")
    async me(@Id() id: string): Promise<MeProfileResponse> {
        return await this.service.getMe(id);
    }

    @Get(":id")
    async getProfile(@Param("id") id: string): Promise<ProfileResponse> {
        return await this.service.findById(id);
    }

    @Patch("me")
    async updateMe(@Id() id: string, @Body() profile: UpdateProfileRequest): Promise<ProfileResponse> {
        return this.service.updateMe(id, profile);
    }

    @Post("batch")
    async batch(@Body() batch: BatchProfilesRequest): Promise<BatchProfilesResponse> {
        return await this.service.batch(batch);
    }

    @Delete("me")
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteMe(@Id() id: string): Promise<void> {
        await this.service.deleteMe(id);
    }
}