import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { DbModule } from './db';
import { FriendshipModule } from './friendship/friendship.module';
import { CommunityModule } from './community/community.module';
import { CommunityDetailsModule } from './community-details/community-details.module';
import { OutboxModule } from './outbox/outbox.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    DbModule,
    OutboxModule,
    FriendshipModule,
    CommunityModule,
    CommunityDetailsModule,
  ],
})
export class AppModule {}
