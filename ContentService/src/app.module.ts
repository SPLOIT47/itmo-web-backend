import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ContentModule } from "./content/content.module";
import { OutboxModule } from "./outbox/outbox.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        OutboxModule,
        ContentModule,
    ],
})
export class AppModule {}

