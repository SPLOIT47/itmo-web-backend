import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    const swaggerConfig = new DocumentBuilder()
        .setTitle("Content Service")
        .setVersion("1.0")
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document, {
        swaggerOptions: { persistAuthorization: true },
    });

    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen(port, "0.0.0.0");

    app.enableShutdownHooks();
}

bootstrap();

