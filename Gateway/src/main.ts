import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  });

  const port = process.env.GATEWAY_PORT ?? 4000;
  await app.listen(port, "0.0.0.0");
}

bootstrap();
