import { Module } from "@nestjs/common";
import { InboxConsumer } from "./consumer/inbox.consumer";
import { InboxRepository } from "./repository/inbox.repository";
import { AuthEventUsecase } from "./usecase/auth-event.usecase";
import { ProfileRepository } from "../profile/repository/profile.repository";

@Module({
    controllers: [InboxConsumer],
    providers: [InboxRepository, AuthEventUsecase, ProfileRepository],
    exports: [AuthEventUsecase],
})
export class InboxModule {}