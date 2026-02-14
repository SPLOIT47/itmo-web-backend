import {Injectable} from "@nestjs/common";
import {Prisma, User} from "@prisma/client"
import {Db} from "../../common/tx/types/tx.types";

@Injectable()
export class UserRepository {

    async findById(db: Db, userId: string): Promise<User | null> {
        return db.user.findUnique({where: {userId}});
    }

    async findByLogin(db: Db, login: string): Promise<User | null> {
        return db.user.findUnique({where: {login}});
    }

    async findByEmail(db: Db, email: string): Promise<User | null> {
        return db.user.findUnique({where: {email}});
    }

    async create(db: Db, entity: Prisma.UserCreateInput): Promise<User> {
       return db.user.create({data: entity});
    }

    async update(db: Db, userId: string, entity: Partial<User>): Promise<User> {
        return db.user.update({
            where: {userId},
            data: entity,
        });
    }

    async delete(db: Db, userId: string): Promise<User | null> {
        try {
            return await db.user.delete({where: {userId}});
        } catch {
            return null;
        }
    }
}