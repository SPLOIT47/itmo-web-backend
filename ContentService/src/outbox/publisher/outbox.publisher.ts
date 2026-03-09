import { Interval } from "@nestjs/schedule";
import { Injectable, Logger } from "@nestjs/common";
import { OutboxRepository } from "../repository/outbox.repository";
import { KafkaProducer } from "../../kafka/producer/kafka.producer";

@Injectable()
export class OutboxPublisher {
    private readonly log = new Logger(OutboxPublisher.name);

    constructor(
        private readonly outbox: OutboxRepository,
        private readonly kafka: KafkaProducer,
    ) {}

    @Interval(2000)
    async publish() {
        const events = await this.outbox.findWithStatus("NEW", 50);

        for (const e of events) {
            try {
                const topic =
                    process.env.KAFKA_CONTENT_TOPIC ?? "content.topic";

                const envelope = {
                    eventId: e.outboxEventId,
                    eventType: e.eventType,
                    payload: e.payload,
                    createdAt: e.createdAt.toISOString(),
                };

                await this.kafka.send(topic, e.outboxEventId, envelope);

                await this.outbox.markSent(e.outboxEventId);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                await this.outbox.markFailed(e.outboxEventId, message);
                this.log.warn(
                    `Failed to publish outbox with id=${e.outboxEventId}`,
                    message,
                );
            }
        }
    }
}

