import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { ApplyContentEventUseCase } from "../usecase/apply-content-event.usecase";
import type { ContentEvent } from "@app/contracts/kafka/content";
import { normalizeKafkaJsonEnvelope } from "../../kafka/kafka-envelope.util";

@Controller()
export class ContentEventConsumer {
    private readonly log = new Logger(ContentEventConsumer.name);

    constructor(
        private readonly usecase: ApplyContentEventUseCase,
    ) {}

    @EventPattern(process.env.KAFKA_CONTENT_TOPIC ?? "content.topic")
    async consume(@Payload() raw: unknown): Promise<void> {
        const parsed = normalizeKafkaJsonEnvelope(raw);
        if (!parsed) {
            this.log.warn(
                `Content Kafka: failed to parse (topic=${process.env.KAFKA_CONTENT_TOPIC ?? "content.topic"})`,
            );
            return;
        }

        const message = {
            eventId: parsed.eventId,
            eventType: parsed.eventType,
            payload: parsed.payload,
            createdAt: parsed.createdAt,
        } as ContentEvent;

        try {
            await this.usecase.handle(message);
        } catch (e) {
            this.log.error(`Failed process content event=${message?.eventId}`, e);
            throw e;
        }
    }
}

