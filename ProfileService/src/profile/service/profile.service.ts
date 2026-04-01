import {ConflictException, Injectable, NotFoundException} from "@nestjs/common";
import {ProfileResponse} from "../payload/response/ProfileResponse";
import {ProfileRepository} from "../repository/profile.repository";
import {toProfileResponse} from "../mapper/mapper.profile";
import {SearchProfilesResponse} from "../payload/response/SearchProfileResponse";
import {SearchProfilesRequest} from "../payload/request/SearchProfileRequest";
import {profiles} from "../../db/schema";
import {BatchProfilesRequest} from "../payload/request/BatchProfileRequest";
import {BatchProfilesResponse} from "../payload/response/BatchProfileResponse";
import {UpdateProfileRequest} from "../payload/request/UpdateProfileRequest";
import {MeProfileResponse} from "../payload/response/MeProfileResponse";

@Injectable()
export class ProfileService {

    constructor(private readonly repository: ProfileRepository) {}

    async findById(id: string): Promise<ProfileResponse> {
        const row = await this.repository.findById(id);

        if (row == null) throw new NotFoundException("Profile not found");

        return  toProfileResponse(row);
    }

    async findProfile(req: SearchProfilesRequest): Promise<SearchProfilesResponse> {
        const result = await this.repository.search(req.q, req.limit, req.offset);

        const profiles = result.rows.map(toProfileResponse);

        return {
            results: profiles,
            hasMore: result.hasMore,
            nextOffset: result.nextOffset
        };
    }

    async batch(req: BatchProfilesRequest): Promise<BatchProfilesResponse> {
        const result = await this.repository.batch(req.ids);
        const map = new Map(result.map(e => [e.userId, e]));

        return {
            profiles: req.ids
                .map(id => map.get(id))
                .filter(e => e != null)
                .map(e => toProfileResponse(e))
        };
    }

    async getMe(userId: string): Promise<MeProfileResponse> {
        const row = await this.repository.findById(userId);

        if (!row) {
            return { status: "PENDING" };
        }

        return {
            status: "READY",
            profile: toProfileResponse(row),
        };
    }

    async updateMe(userId: string, req: UpdateProfileRequest): Promise<ProfileResponse> {

        const row = await this.repository.findById(userId);

        if (!row) {
            throw new ConflictException({
                status: "NOT_READY",
                message: "Profile is not ready yet. Try again later.",
            });
        }

        const updated = await this.repository.update(userId, req);

        return toProfileResponse(updated);
    }

    async deleteMe(userId: string): Promise<void> {
        await this.repository.delete(userId);
    }
}