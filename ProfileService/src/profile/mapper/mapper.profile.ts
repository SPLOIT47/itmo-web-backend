import {profiles} from "../../db/schema";
import {ProfileResponse} from "../payload/response/ProfileResponse";

export function toProfileResponse(row: typeof profiles.$inferSelect): ProfileResponse {
    return {
        id: row.userId,
        name: row.name,
        surname: row.surname,
        bio: row.bio ?? undefined,
        birthday: row.birthday ? row.birthday.toString().slice(0, 10) : undefined,
        city: row.city ?? undefined,
        education: row.education ?? undefined,
        languages: row.languages ?? undefined,
        avatarUrl: row.avatarUrl ?? undefined,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

