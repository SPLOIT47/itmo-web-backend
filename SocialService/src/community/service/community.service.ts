import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Database } from '../../db';
import { OutboxRepository } from '../../outbox/repository/outbox.repository';
import { SocialEvents } from '../../outbox/social-events';
import { CommunityRepository } from '../repository/community.repository';
import type { CreateCommunityDto } from '../payload/create-community.dto';
import type { UpdateCommunityDto } from '../payload/update-community.dto';

@Injectable()
export class CommunityService {
  constructor(
    @Inject('DRIZZLE') private readonly db: Database,
    private readonly repo: CommunityRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async create(userId: string, dto: CreateCommunityDto) {
    return this.db.transaction(async (tx: any) => {
      const community = await this.repo.createCommunity(tx, userId, dto);
      await this.outbox.createEvent(tx, SocialEvents.COMMUNITY_CREATED, {
        communityId: community.communityId,
        ownerUserId: community.ownerUserId,
        name: community.name,
        type: community.type,
        category: community.category,
        createdAt: community.createdAt,
      });
      // Иначе в Feed нет feed_sources (community, id) — владелец не видит посты группы в общей ленте.
      const now = new Date().toISOString();
      await this.outbox.createEvent(tx, SocialEvents.COMMUNITY_SUBSCRIBED, {
        communityId: community.communityId,
        userId,
        role: 'OWNER',
        createdAt: now,
        version: 1,
      });
      return community;
    });
  }

  async update(userId: string, communityId: string, dto: UpdateCommunityDto) {
    const existing = await this.repo.findById(this.db, communityId);
    if (!existing) throw new NotFoundException('Community not found');
    if (existing.ownerUserId !== userId) throw new ForbiddenException('Owner only');

    return this.db.transaction(async (tx: any) => {
      const updated = await this.repo.updateCommunity(tx, communityId, dto as any);
      if (!updated) throw new NotFoundException('Community not found');
      await this.outbox.createEvent(tx, SocialEvents.COMMUNITY_UPDATED, {
        communityId: updated.communityId,
        ownerUserId: updated.ownerUserId,
        version: updated.version,
        updatedAt: updated.updatedAt,
      });
      return updated;
    });
  }

  async softDelete(userId: string, communityId: string) {
    const existing = await this.repo.findById(this.db, communityId);
    if (!existing) throw new NotFoundException('Community not found');
    if (existing.ownerUserId !== userId) throw new ForbiddenException('Owner only');

    return this.db.transaction(async (tx: any) => {
      const deleted = await this.repo.softDeleteCommunity(tx, communityId);
      if (!deleted) throw new NotFoundException('Community not found');
      await this.outbox.createEvent(tx, SocialEvents.COMMUNITY_DELETED, {
        communityId: deleted.communityId,
        ownerUserId: deleted.ownerUserId,
        deletedAt: deleted.deletedAt,
      });
      return deleted;
    });
  }

  async get(communityId: string) {
    const community = await this.repo.findById(this.db, communityId);
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async search(q?: string) {
    return this.repo.search(this.db, q);
  }

  async join(userId: string, communityId: string) {
    const community = await this.repo.findById(this.db, communityId);
    if (!community) throw new NotFoundException('Community not found');

    return this.db.transaction(async (tx: any) => {
      const member = await this.repo.join(tx, communityId, userId);
      const now = new Date().toISOString();
      await this.outbox.createEvent(tx, SocialEvents.COMMUNITY_SUBSCRIBED, {
        communityId,
        userId,
        role: member.role,
        createdAt: now,
        version: 1,
      });
      return member;
    });
  }

  async leave(userId: string, communityId: string) {
    const community = await this.repo.findById(this.db, communityId);
    if (!community) throw new NotFoundException('Community not found');

    return this.db.transaction(async (tx: any) => {
      await this.repo.leave(tx, communityId, userId);
      const now = new Date().toISOString();
      await this.outbox.createEvent(tx, SocialEvents.COMMUNITY_UNSUBSCRIBED, {
        communityId,
        userId,
        createdAt: now,
        version: 1,
      });
      return { success: true };
    });
  }

  async members(communityId: string) {
    const community = await this.repo.findById(this.db, communityId);
    if (!community) throw new NotFoundException('Community not found');
    return this.repo.listMembers(this.db, communityId);
  }

  async my(userId: string) {
    return this.repo.listMyCommunities(this.db, userId);
  }
}

