import {Prisma} from "@prisma/client";
import {PrismaService} from "../../../prisma/prisma.service";

export type Tx = Prisma.TransactionClient;
export type Db = PrismaService | Tx;