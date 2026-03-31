import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../../db';
import { schema } from '../../db';

type Tx = any;

@Injectable()
export class CommunityDetailsRepository {
  constructor(@Inject('DRIZZLE') private readonly db: Database) {}

  async get(dbLike: any, communityId: string) {
    const detailsRows = await dbLike
      .select()
      .from(schema.communityDetails)
      .where(eq(schema.communityDetails.communityId, communityId))
      .limit(1);

    const links = await dbLike
      .select()
      .from(schema.communityLinks)
      .where(eq(schema.communityLinks.communityId, communityId))
      .orderBy(schema.communityLinks.pinned, schema.communityLinks.position);

    return { details: detailsRows[0] ?? null, links };
  }

  async upsertDetails(
    tx: Tx,
    communityId: string,
    patch: Partial<{
      shortDescription: string | null;
      fullDescription: string | null;
      tags: string[] | null;
      statusType: string | null;
      statusOpensAt: Date | null;
      addressCity: string | null;
      addressStreet: string | null;
      addressBuilding: string | null;
      contactsEmail: string | null;
      contactsPhone: string | null;
      contactsTelegram: string | null;
      contactsVk: string | null;
      contactsWebsite: string | null;
    }>,
  ) {
    const existing = await tx
      .select()
      .from(schema.communityDetails)
      .where(eq(schema.communityDetails.communityId, communityId))
      .limit(1);

    if (!existing[0]) {
      const [row] = await tx
        .insert(schema.communityDetails)
        .values({
          communityId,
          shortDescription: patch.shortDescription ?? null,
          fullDescription: patch.fullDescription ?? null,
          tags: patch.tags ?? null,
          statusType: patch.statusType ?? null,
          statusOpensAt: patch.statusOpensAt ?? null,
          addressCity: patch.addressCity ?? null,
          addressStreet: patch.addressStreet ?? null,
          addressBuilding: patch.addressBuilding ?? null,
          contactsEmail: patch.contactsEmail ?? null,
          contactsPhone: patch.contactsPhone ?? null,
          contactsTelegram: patch.contactsTelegram ?? null,
          contactsVk: patch.contactsVk ?? null,
          contactsWebsite: patch.contactsWebsite ?? null,
        })
        .returning();
      return row;
    }

    const [row] = await tx
      .update(schema.communityDetails)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(eq(schema.communityDetails.communityId, communityId))
      .returning();
    return row;
  }

  async replaceLinks(tx: Tx, communityId: string, links: Array<{ title: string; url: string; pinned?: boolean }>) {
    await tx.delete(schema.communityLinks).where(eq(schema.communityLinks.communityId, communityId));

    if (links.length === 0) return;

    await tx.insert(schema.communityLinks).values(
      links.map((l, idx) => ({
        communityId,
        title: l.title,
        url: l.url,
        pinned: l.pinned ?? false,
        position: idx,
      })),
    );
  }
}

