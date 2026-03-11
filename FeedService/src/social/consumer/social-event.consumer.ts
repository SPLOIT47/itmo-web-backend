import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { ApplySocialEventUseCase } from "../usecase/apply-social-event.usecase";
import { SocialEvent } from "@app/contracts/kafka/social";

@Controller()
export class SocialEventConsumer {
    private readonly log = new Logger(SocialEventConsumer.name);

    constructor(private readonly usecase: ApplySocialEventUseCase) {}

    @EventPattern(process.env.KAFKA_SOCIAL_TOPIC ?? "social.topic")
    async consume(@Payload() message: SocialEvent): Promise<void> {
        try {
            await this.usecase.handle(message);
        } catch (e) {
            this.log.error(`Failed process social event=${message?.eventId}`, e);
            throw e;
        }
    }
}

