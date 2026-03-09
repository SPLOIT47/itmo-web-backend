"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthEventType = void 0;
exports.isUserRegisteredEvent = isUserRegisteredEvent;
exports.isUserCredentialsUpdatedEvent = isUserCredentialsUpdatedEvent;
var AuthEventType;
(function (AuthEventType) {
    AuthEventType["USER_REGISTERED"] = "USER_REGISTERED";
    AuthEventType["USER_CREDENTIALS_UPDATED"] = "USER_CREDENTIALS_UPDATED";
})(AuthEventType || (exports.AuthEventType = AuthEventType = {}));
function isUserRegisteredEvent(e) {
    return e.eventType === AuthEventType.USER_REGISTERED;
}
function isUserCredentialsUpdatedEvent(e) {
    return e.eventType === AuthEventType.USER_CREDENTIALS_UPDATED;
}
