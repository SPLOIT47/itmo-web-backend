"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
const configuration_1 = __importDefault(require("./config/configuration"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle("Feed Service")
        .setVersion("1.0")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup("docs", app, document, {
        swaggerOptions: { persistAuthorization: true },
    });
    const cfg = (0, configuration_1.default)();
    app.connectMicroservice({
        transport: microservices_1.Transport.KAFKA,
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
//# sourceMappingURL=main.js.map