import {Injectable} from "@nestjs/common";
import {PrismaService} from "../../prisma/prisma.service";
import {Db} from "../../common/tx/types/tx.types";
import {OutboxEventType, OutboxStatus, Prisma} from "@prisma/client";

@Injectable()
export class OutboxRepository {

    constructor(private readonly prisma: PrismaService) {}

    create(db: Db, eventType: OutboxEventType, payload: any) {
        return db.outboxEvent.create({
            data: {
                eventType: eventType,
                payload: payload,
            },
        });
    }

    findWithStatus(db: Db, status: OutboxStatus, limit: number) {
        return db.outboxEvent.findMany({
            where: { status: status },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }

    markSent(db: Db, outboxEventId: string) {
        return this.updateById(db, outboxEventId, {
            status: 'SENT',
            sentAt: new Date(),
            lastError: null,
        });
    }

    markFailed(db: Db, outboxEventId: string, error: string) {
        return this.updateById(db, outboxEventId, {
            status: 'FAILED',
            attempts: { increment: 1 },
            lastError: error,
        });
    }

    markNew(db: Db, outboxEventId: string) {
        return this.updateById(db, outboxEventId, {
            status: 'NEW',
        });
    }

    private updateById(db: Db, outboxEventId: string, data: Prisma.OutboxEventUpdateInput) {
        return db.outboxEvent.update({
            where: { outboxEventId },
            data,
        });
    }
}