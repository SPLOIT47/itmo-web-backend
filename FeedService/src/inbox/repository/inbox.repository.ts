import { Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/db";
import { inbox_events } from "../../db/schema";

type InboxInsert = typeof inbox_events.$inferInsert;

@Injectable()
export class InboxRepository {
    async exists(eventId: string, tx: any = db): Promise<boolean> {
        const rows = await tx
            .select({ eventId: inbox_events.eventId })
            .from(inbox_events)
            .where(eq(inbox_events.eventId, eventId))
            .limit(1);
        return rows.length > 0;
    }

    async getLastVersionForAggregate(aggregateId: string, tx: any = db,): Promise<number | null> {
        const rows = await tx
            .select({ version: inbox_events.version })
            .from(inbox_events)
            .where(eq(inbox_events.aggregateId, aggregateId))
            .orderBy(desc(inbox_events.version))
            .limit(1);
        return rows[0]?.version ?? null;
    }

    async save(data: InboxInsert, tx: any = db,): Promise<void> {
        await tx.insert(inbox_events).values(data).onConflictDoNothing({
            target: [inbox_events.aggregateId, inbox_events.version],
        });
    }
}

