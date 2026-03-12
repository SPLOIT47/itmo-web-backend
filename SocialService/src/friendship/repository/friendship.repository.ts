import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import type { Database } from '../../db';
import { schema } from '../../db';
import type { FriendRequestStatus } from '../payload/friend.types';

type Tx = any;

@Injectable()
export class FriendshipRepository {
  constructor(@Inject('DRIZZLE') private readonly db: Database) {}

  private normalizePair(user1: string, user2: string) {
    return user1 < user2 ? { userA: user1, userB: user2 } : { userA: user2, userB: user1 };
  }

  async findFriendshipBetween(tx: Tx, user1: string, user2: string) {
    const { userA, userB } = this.normalizePair(user1, user2);
    const rows = await tx
      .select()
      .from(schema.friendships)
      .where(and(eq(schema.friendships.userA, userA), eq(schema.friendships.userB, userB), isNull(schema.friendships.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async createFriendship(tx: Tx, user1: string, user2: string) {
    const { userA, userB } = this.normalizePair(user1, user2);
    const [row] = await tx
      .insert(schema.friendships)
      .values({ userA, userB })
      .returning();
    return row;
  }

  async softDeleteFriendship(tx: Tx, user1: string, user2: string) {
    const { userA, userB } = this.normalizePair(user1, user2);
    const [row] = await tx
      .update(schema.friendships)
      .set({ deletedAt: new Date(), version: sql`${schema.friendships.version} + 1` })
      .where(and(eq(schema.friendships.userA, userA), eq(schema.friendships.userB, userB), isNull(schema.friendships.deletedAt)))
      .returning();
    return row ?? null;
  }

  async findPendingRequestBetween(tx: Tx, userA: string, userB: string) {
    const rows = await tx
      .select()
      .from(schema.friendRequests)
      .where(
        and(
          eq(schema.friendRequests.status, 'PENDING'),
          or(
            and(eq(schema.friendRequests.requesterUserId, userA), eq(schema.friendRequests.targetUserId, userB)),
            and(eq(schema.friendRequests.requesterUserId, userB), eq(schema.friendRequests.targetUserId, userA)),
          ),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findPendingRequest(tx: Tx, requesterUserId: string, targetUserId: string) {
    const rows = await tx
      .select()
      .from(schema.friendRequests)
      .where(
        and(
          eq(schema.friendRequests.requesterUserId, requesterUserId),
          eq(schema.friendRequests.targetUserId, targetUserId),
          eq(schema.friendRequests.status, 'PENDING'),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async createFriendRequest(tx: Tx, requesterUserId: string, targetUserId: string) {
    const [row] = await tx
      .insert(schema.friendRequests)
      .values({
        requesterUserId,
        targetUserId,
        status: 'PENDING',
      })
      .returning();
    return row;
  }

  async updateFriendRequestStatus(tx: Tx, requestId: string, status: FriendRequestStatus) {
    const [row] = await tx
      .update(schema.friendRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.friendRequests.requestId, requestId))
      .returning();
    return row ?? null;
  }

  async listIncoming(db: Database, userId: string) {
    return db
      .select()
      .from(schema.friendRequests)
      .where(and(eq(schema.friendRequests.targetUserId, userId), eq(schema.friendRequests.status, 'PENDING')));
  }

  async listOutgoing(db: Database, userId: string) {
    return db
      .select()
      .from(schema.friendRequests)
      .where(and(eq(schema.friendRequests.requesterUserId, userId), eq(schema.friendRequests.status, 'PENDING')));
  }

  async listFriends(db: Database, userId: string) {
    const rows = await db
      .select()
      .from(schema.friendships)
      .where(and(isNull(schema.friendships.deletedAt), or(eq(schema.friendships.userA, userId), eq(schema.friendships.userB, userId))));
    return rows.map((f) => (f.userA === userId ? f.userB : f.userA));
  }
}

