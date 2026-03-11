import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { ApplyContentEventUseCase } from "../usecase/apply-content-event.usecase";
import { ContentEvent } from "@app/contracts/kafka/content";

@Controller()
export class ContentEventConsumer {
    private readonly log = new Logger(ContentEventConsumer.name);

    constructor(
        private readonly usecase: ApplyContentEventUseCase,
    ) {}

    @EventPattern(process.env.KAFKA_CONTENT_TOPIC ?? "content.topic")
    async consume(@Payload() message: ContentEvent): Promise<void> {
        try {
            await this.usecase.handle(message);
        } catch (e) {
            this.log.error(`Failed process content event=${message?.eventId}`, e);
            throw e;
        }
    }
}

