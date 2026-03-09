import { Module } from "@nestjs/common";
import { OutboxRepository } from "./repository/outbox.repository";
import { OutboxPublisher } from "./publisher/outbox.publisher";
import { KafkaModule } from "../kafka/kafka.module";

@Module({
    imports: [KafkaModule],
    providers: [OutboxRepository, OutboxPublisher],
    exports: [OutboxRepository],
})
export class OutboxModule {}

