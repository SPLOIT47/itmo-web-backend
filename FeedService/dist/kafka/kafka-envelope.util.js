"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeKafkaJsonEnvelope = normalizeKafkaJsonEnvelope;
function normalizeKafkaJsonEnvelope(raw) {
    const tryParseObject = (v) => {
        if (v == null)
            return null;
        if (Buffer.isBuffer(v)) {
            try {
                const o = JSON.parse(v.toString("utf8"));
                return typeof o === "object" &&
                    o !== null &&
                    !Array.isArray(o)
                    ? o
                    : null;
            }
            catch {
                return null;
            }
        }
        if (typeof v === "string") {
            try {
                const o = JSON.parse(v);
                return typeof o === "object" &&
                    o !== null &&
                    !Array.isArray(o)
                    ? o
                    : null;
            }
            catch {
                return null;
            }
        }
        if (typeof v === "object" && !Array.isArray(v)) {
            return v;
        }
        return null;
    };
    let obj = tryParseObject(raw);
    if (!obj && typeof raw === "object" && raw !== null && "value" in raw) {
        obj = tryParseObject(raw.value);
    }
    if (!obj)
        return null;
    const eventId = String(obj.eventId ?? obj.id ?? "").trim();
    const eventType = String(obj.eventType ?? obj.type ?? "").trim();
    if (!eventId || !eventType) {
        return null;
    }
    return {
        eventId,
        eventType,
        payload: obj.payload,
        createdAt: typeof obj.createdAt === "string"
            ? obj.createdAt
            : new Date().toISOString(),
    };
}
//# sourceMappingURL=kafka-envelope.util.js.map