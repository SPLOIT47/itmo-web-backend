import { Injectable } from "@nestjs/common";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { outbox_events } from "../../db/schema";

type OutboxEventSelect = typeof outbox_events.$inferSelect;

@Injectable()
export class OutboxRepository {
    async create(
        eventType: string,
        payload: unknown,
        tx: any = db,
    ): Promise<OutboxEventSelect> {
        const rows = await tx
            .insert(outbox_events)
            .values({
                eventType,
                payload: payload as Record<string, unknown>,
                status: "NEW",
            })
            .returning();
        return rows[0]!;
    }

    async findWithStatus(
        status: string,
        limit: number,
    ): Promise<OutboxEventSelect[]> {
        return db
            .select()
            .from(outbox_events)
            .where(eq(outbox_events.status, status))
            .orderBy(asc(outbox_events.createdAt))
            .limit(limit);
    }

    async markSent(outboxEventId: string, tx: any = db): Promise<void> {
        await tx
            .update(outbox_events)
            .set({
                status: "SENT",
                sentAt: new Date(),
                lastError: null,
            })
            .where(eq(outbox_events.outboxEventId, outboxEventId));
    }

    async markFailed(
        outboxEventId: string,
        error: string,
        tx: any = db,
    ): Promise<void> {
        await tx
            .update(outbox_events)
            .set({
                status: "FAILED",
                attempts: sql`${outbox_events.attempts} + 1`,
                lastError: error,
            })
            .where(eq(outbox_events.outboxEventId, outboxEventId));
    }
}
