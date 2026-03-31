export function normalizeKafkaJsonEnvelope(raw: unknown): { eventId: string; eventType: string; payload: unknown; createdAt: string; } | null {
    const tryParseObject = (v: unknown): Record<string, unknown> | null => {
        if (v == null) return null;
        if (Buffer.isBuffer(v)) {
            try {
                const o = JSON.parse(v.toString("utf8")) as unknown;
                return typeof o === "object" &&
                    o !== null &&
                    !Array.isArray(o)
                    ? (o as Record<string, unknown>)
                    : null;
            } catch {
                return null;
            }
        }
        if (typeof v === "string") {
            try {
                const o = JSON.parse(v) as unknown;
                return typeof o === "object" &&
                    o !== null &&
                    !Array.isArray(o)
                    ? (o as Record<string, unknown>)
                    : null;
            } catch {
                return null;
            }
        }
        if (typeof v === "object" && !Array.isArray(v)) {
            return v as Record<string, unknown>;
        }
        return null;
    };

    let obj = tryParseObject(raw);
    if (!obj && typeof raw === "object" && raw !== null && "value" in raw) {
        obj = tryParseObject((raw as Record<string, unknown>).value);
    }
    if (!obj) return null;

    const eventId = String(obj.eventId ?? obj.id ?? "").trim();
    const eventType = String(obj.eventType ?? obj.type ?? "").trim();
    if (!eventId || !eventType) {
        return null;
    }

    return {
        eventId,
        eventType,
        payload: obj.payload,
        createdAt:
            typeof obj.createdAt === "string"
                ? obj.createdAt
                : new Date().toISOString(),
    };
}
