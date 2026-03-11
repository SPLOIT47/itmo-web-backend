import {Injectable} from "@nestjs/common";
import {inbox_events} from "../../db/schema";
import {eq} from "drizzle-orm";
import {db} from "../../db";

@Injectable()
export class InboxRepository {

    async exists(id: string, tx: any = db ): Promise<boolean> {
        const row = await tx
            .select()
            .from(inbox_events)
            .where(eq(inbox_events.eventId, id))
            .limit(1);

        return row.length > 0;
    }

    async save(entity: typeof inbox_events.$inferInsert, tx: any = db): Promise<void> {
        await tx.insert(inbox_events)
            .values(entity);
    }
}