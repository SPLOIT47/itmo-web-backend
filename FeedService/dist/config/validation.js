"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.validationSchema = joi_1.default.object({
    PORT: joi_1.default.number().integer().min(1).max(65535).required(),
    DATABASE_URL: joi_1.default.string().uri().required(),
    KAFKA_BROKERS: joi_1.default.string().required(),
    KAFKA_GROUP_ID: joi_1.default.string().required(),
    KAFKA_CONTENT_TOPIC: joi_1.default.string().default("content.topic"),
    KAFKA_SOCIAL_TOPIC: joi_1.default.string().default("social.topic"),
    KAFKA_SUBSCRIBE_FROM_BEGINNING: joi_1.default.boolean().default(true),
    FEED_MAX_SIZE: joi_1.default.number().integer().min(1).max(5000).required(),
    CONTENT_SERVICE_URL: joi_1.default.string().uri().optional(),
});
//# sourceMappingURL=validation.js.map