import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import configuration from "./config/configuration";

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
        .setTitle("Feed Service")
        .setVersion("1.0")
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document, {
        swaggerOptions: { persistAuthorization: true },
    });

    const cfg = configuration();

    app.connectMicroservice({
        transport: Transport.KAFKA,
        options: {
            client: { brokers: cfg.kafkaBrokers },
            consumer: { groupId: cfg.kafkaGroupId },
            subscribe: {
                fromBeginning: cfg.kafkaSubscribeFromBeginning,
            },
        },
    });

    await app.startAllMicroservices();

    await app.listen(cfg.port, "0.0.0.0");
    app.enableShutdownHooks();
}

bootstrap();

