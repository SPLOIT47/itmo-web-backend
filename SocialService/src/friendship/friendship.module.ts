import { Module } from '@nestjs/common';
import { FriendshipController } from './controller/friendship.controller';
import { FriendshipService } from './service/friendship.service';
import { FriendshipRepository } from './repository/friendship.repository';

@Module({
  controllers: [FriendshipController],
  providers: [FriendshipService, FriendshipRepository],
})
export class FriendshipModule {}

