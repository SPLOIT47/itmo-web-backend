import {ProfileResponse} from "./ProfileResponse";

export class SearchProfilesResponse {
    results: ProfileResponse[];
    hasMore: boolean;
    nextOffset: number;
}