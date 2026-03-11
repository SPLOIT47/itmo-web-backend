import { Module } from "@nestjs/common";
import { InboxRepository } from "./repository/inbox.repository";
import { ContentEventConsumer } from "../content/consumer/content-event.consumer";
import { ApplyContentEventUseCase } from "../content/usecase/apply-content-event.usecase";
import { SocialEventConsumer } from "../social/consumer/social-event.consumer";
import { ApplySocialEventUseCase } from "../social/usecase/apply-social-event.usecase";
import { FeedModule } from "../feed/feed.module";

@Module({
    imports: [FeedModule],
    providers: [
        InboxRepository,
        ApplyContentEventUseCase,
        ApplySocialEventUseCase,
    ],
    controllers: [ContentEventConsumer, SocialEventConsumer],
})
export class InboxModule {}

