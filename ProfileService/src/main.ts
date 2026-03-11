import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
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
        .setTitle("Profile Service")
        .setVersion("1.0")
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document, {
        swaggerOptions: { persistAuthorization: true },
    });

    const brokers = (process.env.KAFKA_BROKERS ?? "kafka:9092")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const groupId = process.env.KAFKA_GROUP_ID ?? "profile-service";

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: { brokers },
            consumer: { groupId },
        },
    });

    await app.startAllMicroservices();

    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen(port, "0.0.0.0");

    app.enableShutdownHooks();
}

bootstrap();