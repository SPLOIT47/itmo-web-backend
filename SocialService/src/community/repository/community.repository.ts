import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import type { Database } from '../../db';
import { schema } from '../../db';

type Tx = any;

@Injectable()
export class CommunityRepository {
  constructor(@Inject('DRIZZLE') private readonly db: Database) {}

  async createCommunity(
    tx: Tx,
    ownerUserId: string,
    payload: {
      name: string;
      type: string;
      category: string;
      description?: string;
      avatarUrl?: string;
      coverUrl?: string;
    },
  ) {
    const [community] = await tx
      .insert(schema.communities)
      .values({
        ownerUserId,
        name: payload.name,
        type: payload.type,
        category: payload.category,
        description: payload.description,
        avatarUrl: payload.avatarUrl,
        coverUrl: payload.coverUrl,
      })
      .returning();

    await tx.insert(schema.communityMembers).values({
      communityId: community.communityId,
      userId: ownerUserId,
      role: 'OWNER',
    });

    return community;
  }

  async findById(dbLike: any, communityId: string) {
    const rows = await dbLike
      .select()
      .from(schema.communities)
      .where(and(eq(schema.communities.communityId, communityId), isNull(schema.communities.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateCommunity(tx: Tx, communityId: string, patch: Record<string, unknown>) {
    const [row] = await tx
      .update(schema.communities)
      .set({
        ...patch,
        updatedAt: new Date(),
        version: sql`${schema.communities.version} + 1`,
      })
      .where(and(eq(schema.communities.communityId, communityId), isNull(schema.communities.deletedAt)))
      .returning();
    return row ?? null;
  }

  async softDeleteCommunity(tx: Tx, communityId: string) {
    const [row] = await tx
      .update(schema.communities)
      .set({ deletedAt: new Date(), version: sql`${schema.communities.version} + 1` })
      .where(and(eq(schema.communities.communityId, communityId), isNull(schema.communities.deletedAt)))
      .returning();
    return row ?? null;
  }

  async join(tx: Tx, communityId: string, userId: string) {
    const existing = await tx
      .select()
      .from(schema.communityMembers)
      .where(and(eq(schema.communityMembers.communityId, communityId), eq(schema.communityMembers.userId, userId)))
      .limit(1);
    if (existing[0]) return existing[0];

    const [row] = await tx
      .insert(schema.communityMembers)
      .values({ communityId, userId, role: 'MEMBER' })
      .returning();
    return row;
  }

  async leave(tx: Tx, communityId: string, userId: string) {
    await tx
      .delete(schema.communityMembers)
      .where(and(eq(schema.communityMembers.communityId, communityId), eq(schema.communityMembers.userId, userId)));
  }

  async listMembers(dbLike: any, communityId: string) {
    return dbLike.select().from(schema.communityMembers).where(eq(schema.communityMembers.communityId, communityId));
  }

  async listMyCommunities(dbLike: any, userId: string) {
    const rows = await dbLike
      .select({ c: schema.communities })
      .from(schema.communityMembers)
      .innerJoin(schema.communities, eq(schema.communities.communityId, schema.communityMembers.communityId))
      .where(and(eq(schema.communityMembers.userId, userId), isNull(schema.communities.deletedAt)));
    return rows.map((r: any) => r.c);
  }

  async search(dbLike: any, q?: string, limit = 20) {
    if (!q || q.trim().length === 0) {
      return dbLike.select().from(schema.communities).where(isNull(schema.communities.deletedAt)).limit(limit);
    }
    const pattern = `%${q}%`;
    return dbLike
      .select()
      .from(schema.communities)
      .where(
        and(
          isNull(schema.communities.deletedAt),
          or(ilike(schema.communities.name, pattern), ilike(schema.communities.description, pattern)),
        ),
      )
      .limit(limit);
  }
}

