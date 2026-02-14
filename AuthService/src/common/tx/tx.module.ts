import {Module} from "@nestjs/common";
import {TxService} from "./service/tx.service";
import {PrismaModule} from "../../prisma/prisma.module";

@Module({
    imports: [PrismaModule],
    providers: [TxService],
    exports: [TxService],
})
export class TxModule {}