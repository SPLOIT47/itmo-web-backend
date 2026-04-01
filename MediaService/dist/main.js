"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    const document = swagger_1.SwaggerModule.createDocument(app, new swagger_1.DocumentBuilder().setTitle('MediaService').setVersion('1.0.0').build());
    swagger_1.SwaggerModule.setup('docs', app, document);
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
