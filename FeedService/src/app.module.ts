import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { validationSchema } from "./config/validation";
import { FeedModule } from "./feed/feed.module";
import { InboxModule } from "./inbox/inbox.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            validationSchema,
            validationOptions: { abortEarly: false },
        }),
        FeedModule,
        InboxModule,
    ],
})
export class AppModule {}

