import { Module } from '@nestjs/common';
import {ConfigModule} from "@nestjs/config";
import Joi from "joi";
import {ScheduleModule} from "@nestjs/schedule";
import {PrismaModule} from "./prisma/prisma.module";
import {TxModule} from "./common/tx/tx.module";
import {KafkaModule} from "./kafka/kafka.module";
import {OutboxModule} from "./outbox/outbox.module";
import {AuthModule} from "./auth/auth.module";

@Module({
  imports: [
      ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env'],
          validationSchema: Joi.object({
              ACCESS_TOKEN_SECRET: Joi.string().required(),
              ACCESS_TOKEN_TTL: Joi.string().pattern(/^\d+[smhd]$/).required(),
              REFRESH_TOKEN_SECRET: Joi.string().required(),
              REFRESH_TOKEN_TTL: Joi.string().pattern(/^\d+[smhd]$/).required(),
              KAFKA_BROKERS: Joi.string().required(),
              KAFKA_AUTH_TOPIC: Joi.string().required(),
              DATABASE_URL: Joi.string().required(),
              COOKIE_SECURE: Joi.string().required(),
          }),
          validationOptions: { abortEarly: false },
      }),
      ScheduleModule.forRoot(),
      PrismaModule,
      TxModule,
      KafkaModule,
      OutboxModule,
      AuthModule,
  ],
})
export class AppModule {}
