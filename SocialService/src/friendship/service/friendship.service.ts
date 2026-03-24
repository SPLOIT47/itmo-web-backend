import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Database } from '../../db';
import { OutboxRepository } from '../../outbox/repository/outbox.repository';
import { SocialEvents } from '../../outbox/social-events';
import { FriendshipRepository } from '../repository/friendship.repository';
import { FriendRequestStatus } from '../payload/friend.types';

@Injectable()
export class FriendshipService {
  constructor(
    @Inject('DRIZZLE') private readonly db: Database,
    private readonly repo: FriendshipRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async sendFriendRequest(userId: string, targetUserId: string) {
    if (userId === targetUserId) throw new BadRequestException('Cannot send friend request to self');

    return this.db.transaction(async (tx: any) => {
      const friendship = await this.repo.findFriendshipBetween(tx, userId, targetUserId);
      if (friendship) throw new BadRequestException('Users are already friends');

      const pending = await this.repo.findPendingRequestBetween(tx, userId, targetUserId);
      if (pending) throw new BadRequestException('Pending friend request already exists');

      const req = await this.repo.createFriendRequest(tx, userId, targetUserId);
      await this.outbox.createEvent(tx, SocialEvents.FRIEND_REQUEST_SENT, {
        requestId: req.requestId,
        requesterUserId: req.requesterUserId,
        targetUserId: req.targetUserId,
        status: req.status,
        createdAt: req.createdAt,
      });
      return req;
    });
  }

  async acceptFriendRequest(userId: string, fromUserId: string) {
    if (userId === fromUserId) throw new BadRequestException('Cannot accept self request');

    return this.db.transaction(async (tx: any) => {
      const request = await this.repo.findPendingRequest(tx, fromUserId, userId);
      if (!request) throw new NotFoundException('Friend request not found');

      const friendship = await this.repo.findFriendshipBetween(tx, userId, fromUserId);
      if (friendship) throw new BadRequestException('Users are already friends');

      const updated = await this.repo.updateFriendRequestStatus(tx, request.requestId, FriendRequestStatus.ACCEPTED);
      const createdFriendship = await this.repo.createFriendship(tx, userId, fromUserId);

      await this.outbox.createEvent(tx, SocialEvents.FRIEND_REQUEST_ACCEPTED, {
        requestId: updated?.requestId ?? request.requestId,
        requesterUserId: request.requesterUserId,
        targetUserId: request.targetUserId,
        friendshipId: createdFriendship.friendshipId,
      });

      const now = new Date().toISOString();
      await this.outbox.createEvent(tx, SocialEvents.FRIEND_ADDED, {
        userId: request.requesterUserId,
        friendId: request.targetUserId,
        createdAt: now,
        version: 1,
      });
      await this.outbox.createEvent(tx, SocialEvents.FRIEND_ADDED, {
        userId: request.targetUserId,
        friendId: request.requesterUserId,
        createdAt: now,
        version: 1,
      });

      return createdFriendship;
    });
  }

  async declineFriendRequest(userId: string, fromUserId: string) {
    if (userId === fromUserId) throw new BadRequestException('Cannot decline self request');

    return this.db.transaction(async (tx: any) => {
      const request = await this.repo.findPendingRequest(tx, fromUserId, userId);
      if (!request) throw new NotFoundException('Friend request not found');

      const updated = await this.repo.updateFriendRequestStatus(tx, request.requestId, FriendRequestStatus.DECLINED);
      await this.outbox.createEvent(tx, SocialEvents.FRIEND_REQUEST_DECLINED, {
        requestId: updated?.requestId ?? request.requestId,
        requesterUserId: request.requesterUserId,
        targetUserId: request.targetUserId,
        status: FriendRequestStatus.DECLINED,
      });

      return updated;
    });
  }

  async cancelOutgoingRequest(userId: string, targetUserId: string) {
    if (userId === targetUserId) throw new BadRequestException('Cannot cancel self request');

    return this.db.transaction(async (tx: any) => {
      const request = await this.repo.findPendingRequest(tx, userId, targetUserId);
      if (!request) throw new NotFoundException('Friend request not found');

      const updated = await this.repo.updateFriendRequestStatus(tx, request.requestId, FriendRequestStatus.CANCELED);
      await this.outbox.createEvent(tx, SocialEvents.FRIEND_REQUEST_DECLINED, {
        requestId: updated?.requestId ?? request.requestId,
        requesterUserId: request.requesterUserId,
        targetUserId: request.targetUserId,
        status: FriendRequestStatus.CANCELED,
      });

      return updated;
    });
  }

  async removeFriend(userId: string, friendUserId: string) {
    if (userId === friendUserId) throw new BadRequestException('Cannot remove self');

    return this.db.transaction(async (tx: any) => {
      const friendship = await this.repo.findFriendshipBetween(tx, userId, friendUserId);
      if (!friendship) throw new NotFoundException('Friendship not found');

      await this.repo.softDeleteFriendship(tx, userId, friendUserId);
      const now = new Date().toISOString();
      await this.outbox.createEvent(tx, SocialEvents.FRIEND_REMOVED, {
        userId,
        friendId: friendUserId,
        createdAt: now,
        version: 1,
      });
      await this.outbox.createEvent(tx, SocialEvents.FRIEND_REMOVED, {
        userId: friendUserId,
        friendId: userId,
        createdAt: now,
        version: 1,
      });

      return { success: true };
    });
  }

  async listMyFriends(userId: string) {
    const friends = await this.repo.listFriends(this.db, userId);
    return { friends };
  }

  async listIncoming(userId: string) {
    return this.repo.listIncoming(this.db, userId);
  }

  async listOutgoing(userId: string) {
    return this.repo.listOutgoing(this.db, userId);
  }

  async deleteUserData(userId: string): Promise<void> {
    await this.db.transaction(async (tx: any) => {
      const friends = await this.repo.listFriends(tx, userId);
      for (const friendUserId of friends) {
        const friendship = await this.repo.findFriendshipBetween(
          tx,
          userId,
          friendUserId,
        );
        if (!friendship) continue;

        await this.repo.softDeleteFriendship(tx, userId, friendUserId);
        const now = new Date().toISOString();
        await this.outbox.createEvent(tx, SocialEvents.FRIEND_REMOVED, {
          userId,
          friendId: friendUserId,
          createdAt: now,
          version: 1,
        });
        await this.outbox.createEvent(tx, SocialEvents.FRIEND_REMOVED, {
          userId: friendUserId,
          friendId: userId,
          createdAt: now,
          version: 1,
        });
      }

      await this.repo.deleteFriendRequestsByUser(tx, userId);
    });
  }

  async getRelation(userId: string, targetUserId: string) {
    if (userId === targetUserId) return { relation: 'self' as const };

    const friendship = await this.db.transaction(async (tx: any) => this.repo.findFriendshipBetween(tx, userId, targetUserId));
    if (friendship) return { relation: 'friends' as const };

    const pending = await this.db.transaction(async (tx: any) =>
      this.repo.findPendingRequestBetween(tx, userId, targetUserId),
    );
    if (pending) {
      if (pending.requesterUserId === userId) return { relation: 'outgoing' as const };
      return { relation: 'incoming' as const };
    }

    return { relation: 'none' as const };
  }
}

