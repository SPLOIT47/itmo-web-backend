import {Module} from "@nestjs/common";
import {KafkaModule} from "../kafka/kafka.module";
import {TxModule} from "../common/tx/tx.module";
import {OutboxPublisher} from "./publisher/outbox.publisher";
import {OutboxRepository} from "./repository/outbox.repository";
import {PrismaModule} from "../prisma/prisma.module";

@Module({
    imports: [KafkaModule, TxModule, PrismaModule],
    providers: [OutboxPublisher, OutboxRepository],
    exports: [OutboxRepository]
})
export class OutboxModule {}