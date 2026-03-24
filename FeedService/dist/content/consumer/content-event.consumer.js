"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ContentEventConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentEventConsumer = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const apply_content_event_usecase_1 = require("../usecase/apply-content-event.usecase");
const kafka_envelope_util_1 = require("../../kafka/kafka-envelope.util");
let ContentEventConsumer = ContentEventConsumer_1 = class ContentEventConsumer {
    usecase;
    log = new common_1.Logger(ContentEventConsumer_1.name);
    constructor(usecase) {
        this.usecase = usecase;
    }
    async consume(raw) {
        const parsed = (0, kafka_envelope_util_1.normalizeKafkaJsonEnvelope)(raw);
        if (!parsed) {
            this.log.warn(`Content Kafka: не удалось разобрать сообщение (topic=${process.env.KAFKA_CONTENT_TOPIC ?? "content.topic"})`);
            return;
        }
        const message = {
            eventId: parsed.eventId,
            eventType: parsed.eventType,
            payload: parsed.payload,
            createdAt: parsed.createdAt,
        };
        try {
            await this.usecase.handle(message);
        }
        catch (e) {
            this.log.error(`Failed process content event=${message?.eventId}`, e);
            throw e;
        }
    }
};
exports.ContentEventConsumer = ContentEventConsumer;
__decorate([
    (0, microservices_1.EventPattern)(process.env.KAFKA_CONTENT_TOPIC ?? "content.topic"),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentEventConsumer.prototype, "consume", null);
exports.ContentEventConsumer = ContentEventConsumer = ContentEventConsumer_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [apply_content_event_usecase_1.ApplyContentEventUseCase])
], ContentEventConsumer);
//# sourceMappingURL=content-event.consumer.js.map