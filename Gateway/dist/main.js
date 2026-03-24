"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173", "http://localhost:3000"],
        credentials: true,
    });
    const port = process.env.GATEWAY_PORT ?? 4000;
    await app.listen(port, "0.0.0.0");
}
bootstrap();
//# sourceMappingURL=main.js.map