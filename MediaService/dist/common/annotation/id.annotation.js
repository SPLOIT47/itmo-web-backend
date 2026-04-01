"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Id = void 0;
const common_1 = require("@nestjs/common");
exports.Id = (0, common_1.createParamDecorator)((_, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    const raw = req.headers['x-user-id'];
    if (raw === undefined || raw === null) {
        throw new common_1.UnauthorizedException('X-User-Id header is missing');
    }
    if (typeof raw !== 'string' || raw.trim().length === 0) {
        throw new common_1.BadRequestException('Invalid X-User-Id header');
    }
    return raw;
});
