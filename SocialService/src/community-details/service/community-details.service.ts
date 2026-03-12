import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Database } from '../../db';
import { OutboxRepository } from '../../outbox/repository/outbox.repository';
import { SocialEvents } from '../../outbox/social-events';
import { CommunityRepository } from '../../community/repository/community.repository';
import { CommunityDetailsRepository } from '../repository/community-details.repository';
import { UpdateCommunityDetailsDto } from '../payload/update-community-details.dto';

@Injectable()
export class CommunityDetailsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: Database,
    private readonly communityRepo: CommunityRepository,
    private readonly detailsRepo: CommunityDetailsRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async get(communityId: string) {
    const community = await this.communityRepo.findById(this.db, communityId);
    if (!community) throw new NotFoundException('Community not found');
    return this.detailsRepo.get(this.db, communityId);
  }

  async update(userId: string, communityId: string, dto: UpdateCommunityDetailsDto) {
    const community = await this.communityRepo.findById(this.db, communityId);
    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerUserId !== userId) throw new ForbiddenException('Owner only');

    return this.db.transaction(async (tx: any) => {
      const statusOpensAt = dto.status?.opensAt ? new Date(dto.status.opensAt) : null;

      await this.detailsRepo.upsertDetails(tx, communityId, {
        shortDescription: dto.shortDescription ?? null,
        fullDescription: dto.fullDescription ?? null,
        tags: dto.tags ?? null,
        statusType: dto.status?.type ?? null,
        statusOpensAt,
        addressCity: dto.address?.city ?? null,
        addressStreet: dto.address?.street ?? null,
        addressBuilding: dto.address?.building ?? null,
        contactsEmail: dto.contacts?.email ?? null,
        contactsPhone: dto.contacts?.phone ?? null,
        contactsTelegram: dto.contacts?.telegram ?? null,
        contactsVk: dto.contacts?.vk ?? null,
        contactsWebsite: dto.contacts?.website ?? null,
      });

      if (dto.links) {
        await this.detailsRepo.replaceLinks(
          tx,
          communityId,
          dto.links
            .filter((l) => typeof l.title === 'string' && typeof l.url === 'string')
            .map((l) => ({ title: l.title!, url: l.url!, pinned: l.pinned })),
        );
      }

      await this.outbox.createEvent(tx, SocialEvents.COMMUNITY_UPDATED, {
        communityId,
        ownerUserId: community.ownerUserId,
        updatedAt: new Date(),
      });

      return this.detailsRepo.get(tx, communityId);
    });
  }
}

