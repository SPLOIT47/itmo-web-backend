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
var ProxyController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyController = void 0;
const common_1 = require("@nestjs/common");
const proxy_service_1 = require("./proxy.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const profile_enrichment_1 = require("./profile-enrichment");
const PROTECTED_PREFIXES = [
    "/api/auth/me",
    "/api/auth/update",
    "/api/auth/logoutAll",
    "/api/feed",
    "/api/profiles/me",
    "/api/profiles/batch",
    "/api/posts",
    "/api/comments",
    "/api/communities",
    "/api/friends",
    "/api/media/upload",
    "/api/media/presign-upload",
];
function needsAuth(path) {
    const normalized = path.replace(/\?.*$/, "");
    return PROTECTED_PREFIXES.some((p) => normalized === p || normalized.startsWith(p + "/"));
}
let ProxyController = ProxyController_1 = class ProxyController {
    constructor(proxy, config, jwt) {
        this.proxy = proxy;
        this.config = config;
        this.jwt = jwt;
        this.log = new common_1.Logger(ProxyController_1.name);
        this.jwtGuard = new jwt_auth_guard_1.JwtAuthGuard(this.jwt, this.config);
    }
    async handle(req, res) {
        const rawUrl = req.originalUrl ?? req.url;
        const [pathname, queryString] = rawUrl.split("?");
        const fullPath = pathname.startsWith("/api") ? pathname : `/api${pathname}`;
        const query = queryString;
        this.log.log(`incoming ${req.method} ${fullPath}${query ? `?${query}` : ""} hasAuth=${!!req.headers.authorization}`);
        if (needsAuth(fullPath)) {
            const authHeader = req.headers.authorization;
            const token = authHeader?.startsWith("Bearer ")
                ? authHeader.slice(7)
                : undefined;
            if (!token) {
                res.status(401).json({
                    message: "Missing or invalid Authorization header",
                });
                return;
            }
            const ctx = {
                switchToHttp: () => ({ getRequest: () => req }),
            };
            try {
                await this.jwtGuard.canActivate(ctx);
                this.log.log(`auth ok path=${fullPath} userId=${req.userId ?? "n/a"}`);
            }
            catch (e) {
                if (e instanceof common_1.UnauthorizedException) {
                    res.status(401).json({ message: e.message });
                    return;
                }
                throw e;
            }
        }
        if (req.method === "DELETE" && fullPath === "/api/auth/me") {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({ message: "Missing userId" });
                return;
            }
            await this.proxy.forward("DELETE", "/api/auth/me", req.headers, undefined, undefined, userId);
            await this.proxy.forward("DELETE", "/api/profiles/me", req.headers, undefined, undefined, userId);
            await this.proxy.forward("DELETE", "/api/posts/me", req.headers, undefined, undefined, userId);
            await this.proxy.forward("DELETE", "/api/friends/me", req.headers, undefined, undefined, userId);
            await this.proxy.forward("DELETE", "/api/communities/me/members", req.headers, undefined, undefined, userId);
            await this.proxy.forward("DELETE", "/api/feed/me", req.headers, undefined, undefined, userId);
            await this.proxy.forward("DELETE", "/api/media/me", req.headers, undefined, undefined, userId);
            res.status(204).end();
            return;
        }
        const contentType = String(req.headers["content-type"] ?? "").toLowerCase();
        const isMultipart = contentType.includes("multipart/form-data");
        let body = undefined;
        if (!isMultipart &&
            req.method !== "GET" &&
            req.method !== "HEAD" &&
            req.body !== undefined) {
            body = req.body;
        }
        const result = await this.proxy.forward(req.method, fullPath, req.headers, body, query, req.userId, isMultipart ? req : undefined);
        this.log.log(`outgoing ${req.method} ${fullPath} status=${result.status} ct=${result.headers["content-type"] ?? ""}`);
        let responseData = result.data;
        if (responseData &&
            typeof responseData === "object" &&
            "accessToken" in responseData &&
            (fullPath === "/api/auth/login" || fullPath === "/api/auth/register")) {
            responseData = { ...responseData, token: responseData.accessToken };
        }
        if (result.status === 200 &&
            responseData !== undefined &&
            (0, profile_enrichment_1.shouldEnrichProfilePayload)(fullPath, req.method)) {
            const ids = (0, profile_enrichment_1.extractProfileUserIds)(responseData);
            if (ids.length > 0) {
                const loginMap = await this.proxy.fetchPublicLogins(ids);
                responseData = (0, profile_enrichment_1.mergeLoginsIntoProfiles)(responseData, loginMap);
            }
        }
        Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v));
        res.status(result.status);
        if (result.status === 204 || responseData === undefined) {
            res.end();
        }
        else if (Buffer.isBuffer(responseData)) {
            res.send(responseData);
        }
        else {
            res.json(responseData);
        }
    }
};
exports.ProxyController = ProxyController;
__decorate([
    (0, common_1.All)("*"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "handle", null);
exports.ProxyController = ProxyController = ProxyController_1 = __decorate([
    (0, common_1.Controller)("api"),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService,
        config_1.ConfigService,
        jwt_1.JwtService])
], ProxyController);
//# sourceMappingURL=proxy.controller.js.map