import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Id } from '../../common/annotation/id.annotation';
import { FriendshipService } from '../service/friendship.service';

@ApiTags('friendship')
@Controller()
export class FriendshipController {
  constructor(private readonly service: FriendshipService) {}

  @Post('friends/requests/:targetUserId')
  @ApiOperation({ summary: 'Send friend request' })
  send(@Id() userId: string, @Param('targetUserId') targetUserId: string) {
    return this.service.sendFriendRequest(userId, targetUserId);
  }

  @Post('friends/requests/:fromUserId/accept')
  @ApiOperation({ summary: 'Accept friend request' })
  accept(@Id() userId: string, @Param('fromUserId') fromUserId: string) {
    return this.service.acceptFriendRequest(userId, fromUserId);
  }

  @Post('friends/requests/:fromUserId/decline')
  @ApiOperation({ summary: 'Decline friend request' })
  decline(@Id() userId: string, @Param('fromUserId') fromUserId: string) {
    return this.service.declineFriendRequest(userId, fromUserId);
  }

  @Delete('friends/requests/:targetUserId')
  @ApiOperation({ summary: 'Cancel outgoing friend request' })
  cancel(@Id() userId: string, @Param('targetUserId') targetUserId: string) {
    return this.service.cancelOutgoingRequest(userId, targetUserId);
  }

  @Delete('friends/:friendUserId')
  @ApiOperation({ summary: 'Remove friend' })
  remove(@Id() userId: string, @Param('friendUserId') friendUserId: string) {
    return this.service.removeFriend(userId, friendUserId);
  }

  @Get('friends/me')
  @ApiOperation({ summary: 'List my friends' })
  myFriends(@Id() userId: string) {
    return this.service.listMyFriends(userId);
  }

  @Get('friends/requests/incoming')
  @ApiOperation({ summary: 'Incoming requests' })
  incoming(@Id() userId: string) {
    return this.service.listIncoming(userId);
  }

  @Get('friends/requests/outgoing')
  @ApiOperation({ summary: 'Outgoing requests' })
  outgoing(@Id() userId: string) {
    return this.service.listOutgoing(userId);
  }

  @Get('friends/relation/:targetUserId')
  @ApiOperation({ summary: 'Relation with user' })
  relation(@Id() userId: string, @Param('targetUserId') targetUserId: string) {
    return this.service.getRelation(userId, targetUserId);
  }
}

