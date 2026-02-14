import {Module} from "@nestjs/common";
import {TxModule} from "../common/tx/tx.module";
import {OutboxModule} from "../outbox/outbox.module";
import {PrismaModule} from "../prisma/prisma.module";
import {JwtModule} from "@nestjs/jwt";
import {AuthService} from "./service/auth.service";
import {UserRepository} from "./repository/user.repository";
import {RefreshTokenRepository} from "./repository/refreshToken.repository";
import {ConfigService} from "@nestjs/config";
import {StringValue} from "ms";
import {AuthController} from "./controller/auth.controller";
import {JwtStrategy} from "./strategy/jwt.strategy";

@Module({
    imports: [TxModule, OutboxModule, PrismaModule,
    JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
            secret: config.get<string>("ACCESS_TOKEN_SECRET")!,
            signOptions: {
                expiresIn: config.get<string>("ACCESS_TOKEN_TTL")! as StringValue
            },
        }),
    }),
    ],
    providers: [AuthService, UserRepository, RefreshTokenRepository, JwtStrategy],
    exports: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}