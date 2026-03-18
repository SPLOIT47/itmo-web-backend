import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../db';
import { schema } from '../../db';
import type { SocialEventType } from '../social-events';

type Tx = any;

@Injectable()
export class OutboxRepository {
  constructor(@Inject('DRIZZLE') private readonly db: Database) {}

  async createEvent(tx: Tx, eventType: SocialEventType, payload: unknown) {
    const [row] = await tx
      .insert(schema.outboxEvents)
      .values({
        eventType,
        payload,
        status: 'PENDING',
      })
      .returning();
    return row;
  }

  async getPendingBatch(limit: number) {
    return this.db.select().from(schema.outboxEvents).where(eq(schema.outboxEvents.status, 'PENDING')).limit(limit);
  }

  async markAsSent(outboxEventId: string) {
    await this.db
      .update(schema.outboxEvents)
      .set({
        status: 'SENT',
        sentAt: new Date(),
        attempts: sql`${schema.outboxEvents.attempts} + 1`,
        lastError: null,
      })
      .where(eq(schema.outboxEvents.outboxEventId, outboxEventId));
  }

  async markAsError(outboxEventId: string, error: string) {
    await this.db
      .update(schema.outboxEvents)
      .set({
        status: 'ERROR',
        attempts: sql`${schema.outboxEvents.attempts} + 1`,
        lastError: error,
      })
      .where(eq(schema.outboxEvents.outboxEventId, outboxEventId));
  }
}

