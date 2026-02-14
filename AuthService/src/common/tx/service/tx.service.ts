import {Injectable} from "@nestjs/common";
import {PrismaService} from "../../../prisma/prisma.service";
import {Tx} from "../types/tx.types";

@Injectable()
export class TxService {

    constructor(private readonly prisma: PrismaService) {}

    run<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        return this.prisma.$transaction((tx: Tx) => fn(tx))
    }

    db(): PrismaService {
        return this.prisma;
    }
}