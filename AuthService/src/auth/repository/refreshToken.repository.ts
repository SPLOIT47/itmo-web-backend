import {Injectable} from "@nestjs/common";
import {Prisma, RefreshToken} from "@prisma/client"
import {Db} from "../../common/tx/types/tx.types";

@Injectable()
export class RefreshTokenRepository {

    async findById(db: Db, refreshTokenId: string): Promise<RefreshToken | null> {
        return db.refreshToken.findUnique({where: {refreshTokenId}});
    }

    async create(db: Db ,entity: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
        return db.refreshToken.create({data: entity})
    }

    async delete(db: Db, refreshTokenId: string): Promise<RefreshToken | null> {
        try {
            return await db.refreshToken.delete({where: {refreshTokenId}});
        } catch {
            return null;
        }
    }

    async revokeAllByUserId(db: Db, userId: string): Promise<number> {
        const res = await db.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });

        return res.count;
    }

    async findActiveByUserAndHash(db: Db, userId: string, tokenHash: string): Promise<RefreshToken | null> {
        return db.refreshToken.findFirst({
            where: {
                userId,
                tokenHash,
                revokedAt: null,
            },
        });
    }

    async findActiveByUserId(db: Db, userId: string): Promise<RefreshToken[]> {
        return db.refreshToken.findMany({
            where: {
                userId,
                revokedAt: null,
            }
        });
    }

    async revoke(db: Db, refreshTokenId: string): Promise<void> {
        await db.refreshToken.update({
            where: { refreshTokenId },
            data: { revokedAt: new Date() },
        });
    }
}