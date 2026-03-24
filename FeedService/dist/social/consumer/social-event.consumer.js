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
var SocialEventConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialEventConsumer = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const apply_social_event_usecase_1 = require("../usecase/apply-social-event.usecase");
let SocialEventConsumer = SocialEventConsumer_1 = class SocialEventConsumer {
    usecase;
    log = new common_1.Logger(SocialEventConsumer_1.name);
    constructor(usecase) {
        this.usecase = usecase;
    }
    async consume(raw) {
        const message = {
            eventId: String(raw.eventId ?? raw.id ?? ""),
            eventType: (raw.eventType ?? raw.type),
            payload: raw.payload,
            createdAt: typeof raw.createdAt === "string"
                ? raw.createdAt
                : new Date().toISOString(),
        };
        if (!message.eventId) {
            this.log.warn("Social Kafka message without eventId/id, skip");
            return;
        }
        try {
            await this.usecase.handle(message);
        }
        catch (e) {
            this.log.error(`Failed process social event=${message?.eventId}`, e);
            throw e;
        }
    }
};
exports.SocialEventConsumer = SocialEventConsumer;
__decorate([
    (0, microservices_1.EventPattern)(process.env.KAFKA_SOCIAL_TOPIC ?? "social.topic"),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocialEventConsumer.prototype, "consume", null);
exports.SocialEventConsumer = SocialEventConsumer = SocialEventConsumer_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [apply_social_event_usecase_1.ApplySocialEventUseCase])
], SocialEventConsumer);
//# sourceMappingURL=social-event.consumer.js.map