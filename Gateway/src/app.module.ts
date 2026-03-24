import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import configuration from "./config/configuration";
import { ProxyModule } from "./proxy/proxy.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("jwt.accessTokenSecret") ?? "access-secret",
        signOptions: { expiresIn: "15m" },
      }),
    }),
    ProxyModule,
  ],
})
export class AppModule {}
