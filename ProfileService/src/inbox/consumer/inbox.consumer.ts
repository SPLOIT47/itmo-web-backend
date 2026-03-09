import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { AuthEventUsecase } from "../usecase/auth-event.usecase";
import type { AuthEvent } from "@app/contracts/kafka/auth";

@Controller()
export class InboxConsumer {
    private readonly log = new Logger(InboxConsumer.name);

    constructor(private readonly usecase: AuthEventUsecase) {}

    @EventPattern("auth.topic")
    async consume(@Payload() message: AuthEvent) {
        try {
            await this.usecase.handle(message);
        } catch (e) {
            this.log.error(`Failed process event=${message?.eventId}`, e);
            throw e;
        }
    }
}