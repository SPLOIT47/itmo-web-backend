import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from "@nestjs/common";
import cookieParser from "cookie-parser";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
  }));

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Auth Service')
    .setVersion('1.0')
    .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'bearer',)
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            withCredentials: true,
        }
    });

    app.enableCors({
        origin: [
            "http://localhost:3001",
            "http://192.133.23.189:3001"
        ],
    });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
