import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { ApplySocialEventUseCase } from "../usecase/apply-social-event.usecase";
import type { SocialEvent } from "@app/contracts/kafka/social";

@Controller()
export class SocialEventConsumer {
    private readonly log = new Logger(SocialEventConsumer.name);

    constructor(private readonly usecase: ApplySocialEventUseCase) {}

    @EventPattern(process.env.KAFKA_SOCIAL_TOPIC ?? "social.topic")
    async consume(@Payload() raw: Record<string, unknown>): Promise<void> {
        const message = {
            eventId: String(raw.eventId ?? raw.id ?? ""),
            eventType: (raw.eventType ?? raw.type) as SocialEvent["eventType"],
            payload: raw.payload,
            createdAt:
                typeof raw.createdAt === "string"
                    ? raw.createdAt
                    : new Date().toISOString(),
        } as SocialEvent;

        if (!message.eventId) {
            this.log.warn("Social Kafka message without eventId/id, skip");
            return;
        }

        try {
            await this.usecase.handle(message);
        } catch (e) {
            this.log.error(`Failed process social event=${message?.eventId}`, e);
            throw e;
        }
    }
}

