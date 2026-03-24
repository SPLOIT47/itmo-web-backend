"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentEventType = void 0;
exports.isPostCreatedEvent = isPostCreatedEvent;
exports.isPostUpdatedEvent = isPostUpdatedEvent;
exports.isPostDeletedEvent = isPostDeletedEvent;
var ContentEventType;
(function (ContentEventType) {
    ContentEventType["POST_CREATED"] = "POST_CREATED";
    ContentEventType["POST_UPDATED"] = "POST_UPDATED";
    ContentEventType["POST_DELETED"] = "POST_DELETED";
    ContentEventType["POST_LIKED"] = "POST_LIKED";
    ContentEventType["POST_UNLIKED"] = "POST_UNLIKED";
    ContentEventType["COMMENT_CREATED"] = "COMMENT_CREATED";
    ContentEventType["COMMENT_DELETED"] = "COMMENT_DELETED";
})(ContentEventType || (exports.ContentEventType = ContentEventType = {}));
function isPostCreatedEvent(e) {
    return e.eventType === ContentEventType.POST_CREATED;
}
function isPostUpdatedEvent(e) {
    return e.eventType === ContentEventType.POST_UPDATED;
}
function isPostDeletedEvent(e) {
    return e.eventType === ContentEventType.POST_DELETED;
}
