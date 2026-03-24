import { inbox_events } from "../../db/schema";
type InboxInsert = typeof inbox_events.$inferInsert;
export declare class InboxRepository {
    exists(eventId: string, tx?: any): Promise<boolean>;
    getLastVersionForAggregate(aggregateId: string, tx?: any): Promise<number | null>;
    save(data: InboxInsert, tx?: any): Promise<void>;
}
export {};
