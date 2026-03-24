"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldEnrichProfilePayload = shouldEnrichProfilePayload;
exports.extractProfileUserIds = extractProfileUserIds;
exports.mergeLoginsIntoProfiles = mergeLoginsIntoProfiles;
function shouldEnrichProfilePayload(fullPath, method) {
    const n = fullPath.replace(/\?.*$/, "");
    if (method === "POST" && n === "/api/profiles/batch")
        return true;
    if (method === "GET" && n.startsWith("/api/profiles/search"))
        return true;
    if (method === "GET" && n === "/api/profiles/me")
        return true;
    if (method === "PATCH" && n === "/api/profiles/me")
        return true;
    if (method === "GET") {
        const m = n.match(/^\/api\/profiles\/([^/]+)$/);
        if (!m)
            return false;
        const seg = m[1];
        if (seg === "search" || seg === "batch")
            return false;
        return true;
    }
    return false;
}
function extractProfileUserIds(data) {
    if (!data || typeof data !== "object")
        return [];
    const o = data;
    if (Array.isArray(o.profiles)) {
        return o.profiles
            .map((p) => p?.id)
            .filter((id) => Boolean(id));
    }
    if (Array.isArray(o.results)) {
        return o.results
            .map((p) => p?.id)
            .filter((id) => Boolean(id));
    }
    if (o.profile && typeof o.profile === "object") {
        const id = o.profile.id;
        if (id)
            return [String(id)];
    }
    if (typeof o.id === "string" &&
        typeof o.name === "string" &&
        typeof o.surname === "string") {
        return [o.id];
    }
    return [];
}
function mergeLoginsIntoProfiles(data, loginByUserId) {
    if (!data || typeof data !== "object")
        return data;
    const o = data;
    if (Array.isArray(o.profiles)) {
        return {
            ...o,
            profiles: o.profiles.map((p) => enrichOneProfile(p, loginByUserId)),
        };
    }
    if (Array.isArray(o.results)) {
        return {
            ...o,
            results: o.results.map((p) => enrichOneProfile(p, loginByUserId)),
        };
    }
    if (typeof o.status === "string" && o.profile && typeof o.profile === "object") {
        return {
            ...o,
            profile: enrichOneProfile(o.profile, loginByUserId),
        };
    }
    if (typeof o.id === "string" && typeof o.name === "string") {
        return enrichOneProfile(o, loginByUserId);
    }
    return data;
}
function enrichOneProfile(p, loginByUserId) {
    const id = String(p.id ?? "");
    const login = loginByUserId.get(id);
    if (!login)
        return p;
    return { ...p, login };
}
//# sourceMappingURL=profile-enrichment.js.map