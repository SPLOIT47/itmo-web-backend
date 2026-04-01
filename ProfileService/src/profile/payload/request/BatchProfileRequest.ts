import { Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

/**
 * Coerce common client/proxy shapes into string[] and strip accidental JSON quote wrapping
 * on each id (e.g. "\"uuid\"") so @IsUUID("all") matches what validator.js expects.
 */
function normalizeProfileBatchIds(value: unknown): string[] {
    if (value === undefined || value === null) {
        return [];
    }
    const raw = Array.isArray(value) ? value : [value];
    const out: string[] = [];
    for (const item of raw) {
        if (typeof item !== "string") {
            continue;
        }
        let s = item.trim();
        if (!s) {
            continue;
        }
        for (let depth = 0; depth < 3; depth++) {
            if (s.length < 2 || s[0] !== '"' || s[s.length - 1] !== '"') {
                break;
            }
            try {
                const parsed = JSON.parse(s);
                if (typeof parsed !== "string") {
                    break;
                }
                s = parsed.trim();
            } catch {
                break;
            }
        }
        if (s) {
            out.push(s);
        }
    }
    return out;
}

export class BatchProfilesRequest {
    @Transform(({ value }) => normalizeProfileBatchIds(value))
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID("all", { each: true })
    ids: string[];
}