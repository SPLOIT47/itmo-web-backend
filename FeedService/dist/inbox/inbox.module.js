"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxModule = void 0;
const common_1 = require("@nestjs/common");
const inbox_repository_1 = require("./repository/inbox.repository");
const content_event_consumer_1 = require("../content/consumer/content-event.consumer");
const apply_content_event_usecase_1 = require("../content/usecase/apply-content-event.usecase");
const social_event_consumer_1 = require("../social/consumer/social-event.consumer");
const apply_social_event_usecase_1 = require("../social/usecase/apply-social-event.usecase");
const feed_module_1 = require("../feed/feed.module");
let InboxModule = class InboxModule {
};
exports.InboxModule = InboxModule;
exports.InboxModule = InboxModule = __decorate([
    (0, common_1.Module)({
        imports: [feed_module_1.FeedModule],
        providers: [
            inbox_repository_1.InboxRepository,
            apply_content_event_usecase_1.ApplyContentEventUseCase,
            apply_social_event_usecase_1.ApplySocialEventUseCase,
        ],
        controllers: [content_event_consumer_1.ContentEventConsumer, social_event_consumer_1.SocialEventConsumer],
    })
], InboxModule);
//# sourceMappingURL=inbox.module.js.map