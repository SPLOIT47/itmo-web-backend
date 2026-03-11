import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ProfileModule } from "./profile/profile.module";
import { InboxModule } from "./inbox/inbox.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ProfileModule,
        InboxModule,
    ],
})
export class AppModule {}