export function shouldEnrichProfilePayload(
  fullPath: string,
  method: string,
): boolean {
  const n = fullPath.replace(/\?.*$/, "");
  if (method === "POST" && n === "/api/profiles/batch") return true;
  if (method === "GET" && n.startsWith("/api/profiles/search")) return true;
  if (method === "GET" && n === "/api/profiles/me") return true;
  if (method === "PATCH" && n === "/api/profiles/me") return true;
  if (method === "GET") {
    const m = n.match(/^\/api\/profiles\/([^/]+)$/);
    if (!m) return false;
    const seg = m[1];
    if (seg === "search" || seg === "batch") return false;
    return true;
  }
  return false;
}

export function extractProfileUserIds(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.profiles)) {
    return (o.profiles as { id?: string }[])
      .map((p) => p?.id)
      .filter((id): id is string => Boolean(id));
  }
  if (Array.isArray(o.results)) {
    return (o.results as { id?: string }[])
      .map((p) => p?.id)
      .filter((id): id is string => Boolean(id));
  }
  if (o.profile && typeof o.profile === "object") {
    const id = (o.profile as { id?: string }).id;
    if (id) return [String(id)];
  }
  if (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.surname === "string"
  ) {
    return [o.id];
  }
  return [];
}

export function mergeLoginsIntoProfiles(
  data: unknown,
  loginByUserId: Map<string, string>,
): unknown {
  if (!data || typeof data !== "object") return data;
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.profiles)) {
    return {
      ...o,
      profiles: (o.profiles as Record<string, unknown>[]).map((p) =>
        enrichOneProfile(p, loginByUserId),
      ),
    };
  }
  if (Array.isArray(o.results)) {
    return {
      ...o,
      results: (o.results as Record<string, unknown>[]).map((p) =>
        enrichOneProfile(p, loginByUserId),
      ),
    };
  }
  if (typeof o.status === "string" && o.profile && typeof o.profile === "object") {
    return {
      ...o,
      profile: enrichOneProfile(
        o.profile as Record<string, unknown>,
        loginByUserId,
      ),
    };
  }
  if (typeof o.id === "string" && typeof o.name === "string") {
    return enrichOneProfile(o as Record<string, unknown>, loginByUserId);
  }
  return data;
}

function enrichOneProfile(
  p: Record<string, unknown>,
  loginByUserId: Map<string, string>,
): Record<string, unknown> {
  const id = String(p.id ?? "");
  const login = loginByUserId.get(id);
  if (!login) return p;
  return { ...p, login };
}
