export declare function normalizeKafkaJsonEnvelope(raw: unknown): {
    eventId: string;
    eventType: string;
    payload: unknown;
    createdAt: string;
} | null;
