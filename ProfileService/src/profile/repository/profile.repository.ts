import {Injectable} from "@nestjs/common";
import { db } from "../../db"
import {profiles} from "../../db/schema";
import {and, asc, eq, ilike, inArray, or} from "drizzle-orm";

@Injectable()
export class ProfileRepository {

    async findById(id: string, tx: any = db) {
        const result = await tx
            .select()
            .from(profiles)
            .where(eq(profiles.userId, id))
            .limit(1);

        return result[0] ?? null;
    }

    async create(entity: typeof profiles.$inferInsert, tx?: any) {
        const exec = tx ?? db;
        await exec.insert(profiles).values(entity);
        return this.findById(entity.userId, exec);
    }

    async update(id: string, data: Partial<typeof profiles.$inferInsert>, tx: any = db) {
        await tx
            .update(profiles)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(profiles.userId, id));

        return this.findById(id, tx);
    }

    async delete(id: string, tx: any = db) {
        const entity = await this.findById(id, tx);

        await tx.delete(profiles).where(eq(profiles.userId, id));

        return entity;
    }

    async batch(ids: string[], tx: any = db): Promise<(typeof profiles.$inferSelect)[]> {
        return tx.select()
            .from(profiles)
            .where(inArray(profiles.userId, ids));
    }

    async search(queryRaw: string, limitRaw = 50, offsetRaw = 0, tx: any = db) {
        const query = (queryRaw ?? "").trim().replace(/\s+/g, " ")

        if (!query || query.length < 2) {
            return {
                rows: [],
                hasMore: false,
                nextOffset: offsetRaw ?? 0,
            };
        }

        const limit = Math.min(Math.max(1, limitRaw), 50);
        const offset = Math.max(0, offsetRaw);

        const parts = query.trim().split(/\s+/);

        const expr = parts.length > 1
            ? or(
                and(
                    ilike(profiles.name, `%${parts[0]}%`),
                    ilike(profiles.surname, `%${parts[1]}%`),
                ),
                ilike(profiles.name, `%${query}%`),
                ilike(profiles.surname, `%${query}%`),
                ilike(profiles.login, `${query}%`),
            )
            : or(
                ilike(profiles.name, `%${query}%`),
                ilike(profiles.surname, `%${query}%`),
                ilike(profiles.login, `${query}%`),
            );

        const rowsSelect = await tx
            .select()
            .from(profiles)
            .where(expr)
            .orderBy(asc(profiles.surname), asc(profiles.name), asc(profiles.login), asc(profiles.userId))
            .limit(limit + 1)
            .offset(offset);

        const hasMore = rowsSelect.length > limit;
        const rows = hasMore ? rowsSelect.slice(0, limit) : rowsSelect;
        const nextOffset = offset + rows.length;

        return { rows, hasMore, nextOffset };
    }

    async getOrCreate(id: string, tx: any = db) {
        await tx
            .insert(profiles)
            .values({
                userId: id,
                login: null,
                name: "",
                surname: "",
            })
            .onConflictDoNothing({ target: profiles.userId });

        return this.findById(id, tx);
    }

    async getIdentityVersion(userId: string, tx: any = db) {
        const rows = await tx
            .select({ v: profiles.identityVersion  })
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1)

        return rows[0]?.v ?? -1;
    }
}