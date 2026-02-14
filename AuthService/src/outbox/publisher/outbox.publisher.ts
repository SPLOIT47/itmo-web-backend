import {Interval} from "@nestjs/schedule";
import {Injectable, Logger} from "@nestjs/common";
import {OutboxRepository} from "../repository/outbox.repository";
import {KafkaProducer} from "../../kafka/producer/kafka.producer";
import {Db} from "../../common/tx/types/tx.types";
import {TxService} from "../../common/tx/service/tx.service";

@Injectable()
export class OutboxPublisher {
    private readonly log = new Logger(OutboxPublisher.name)

    constructor(
        private readonly outbox: OutboxRepository,
        private readonly kafka: KafkaProducer,
        private readonly tx: TxService,
    ) {}

    @Interval(2000)
    async publish() {
        const db: Db = this.tx.db();
        const events = await this.outbox.findWithStatus(db, 'NEW', 50);

        for (const e of events) {
            try {
                const topic = process.env.KAFKA_AUTH_TOPIC!;

                await this.kafka.send(topic, e.outboxEventId, {
                    eventId: e.outboxEventId,
                    eventType: e.eventType,
                    payload: e.payload,
                    createdAt: e.createdAt,
                });

                await this.outbox.markSent(db, e.outboxEventId);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                await this.outbox.markFailed(db, e.outboxEventId, message);
                this.log.warn(`Failed to publish outbox with id=${e.outboxEventId}`, message);
            }
        }
    }
}
