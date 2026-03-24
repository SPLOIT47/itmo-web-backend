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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ProxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const SEGMENT_TO_BASE = {
    auth: "auth",
    feed: "feed",
    profiles: "profile",
    posts: "content",
    comments: "content",
    communities: "social",
    friends: "social",
    media: "media",
};
let ProxyService = ProxyService_1 = class ProxyService {
    constructor(config) {
        this.config = config;
        this.log = new common_1.Logger(ProxyService_1.name);
        const s = this.config.get("services");
        this.bases = {
            auth: s?.auth ?? "http://localhost:3001",
            profile: s?.profile ?? "http://localhost:3002",
            content: s?.content ?? "http://localhost:3003",
            social: s?.social ?? "http://localhost:3004",
            media: s?.media ?? "http://localhost:3005",
            feed: s?.feed ?? "http://localhost:3006",
        };
    }
    getBaseUrl(apiPath) {
        const afterApi = apiPath.replace(/^\/api\/?/, "") || "";
        const segment = afterApi.split("/")[0]?.toLowerCase() ?? "";
        const serviceKey = SEGMENT_TO_BASE[segment];
        const base = serviceKey ? this.bases[serviceKey] : this.bases.auth;
        const path = "/" + afterApi;
        return { base, path };
    }
    async forward(method, apiPath, headers, body, query, userId, rawBody) {
        const { base, path } = this.getBaseUrl(apiPath);
        const url = query ? `${base}${path}?${query}` : `${base}${path}`;
        const forwardHeaders = {};
        if (userId) {
            forwardHeaders["x-user-id"] = userId;
        }
        if (headers["content-type"]) {
            forwardHeaders["content-type"] = String(headers["content-type"]);
        }
        if (headers["content-length"]) {
            forwardHeaders["content-length"] = String(headers["content-length"]);
        }
        if (headers["cookie"]) {
            forwardHeaders["cookie"] = String(headers["cookie"]);
        }
        if (headers["authorization"]) {
            forwardHeaders["authorization"] = String(headers["authorization"]);
        }
        const payload = rawBody &&
            (method === "POST" || method === "PUT" || method === "PATCH")
            ? rawBody
            : body;
        const config = {
            method: method,
            url,
            headers: forwardHeaders,
            data: payload,
            maxRedirects: 0,
            validateStatus: () => true,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            responseType: "arraybuffer",
        };
        this.log.log(`forward ${method} ${apiPath} -> ${url} ct=${String(forwardHeaders["content-type"] ?? "")}`);
        const res = await axios_1.default.request(config);
        const contentType = String(res.headers["content-type"] ?? "").toLowerCase();
        const raw = Buffer.isBuffer(res.data)
            ? res.data
            : Buffer.from(res.data ?? []);
        let responseData = raw;
        if (contentType.includes("application/json")) {
            try {
                responseData = JSON.parse(raw.toString("utf8"));
            }
            catch {
                responseData = raw.toString("utf8");
            }
        }
        else if (contentType.startsWith("text/")) {
            responseData = raw.toString("utf8");
        }
        this.log.log(`response ${method} ${apiPath} status=${res.status} ct=${contentType} bytes=${raw.length} kind=${Buffer.isBuffer(responseData) ? "buffer" : typeof responseData}`);
        const resHeaders = {};
        if (res.headers["set-cookie"]) {
            resHeaders["set-cookie"] = Array.isArray(res.headers["set-cookie"])
                ? res.headers["set-cookie"].join(", ")
                : res.headers["set-cookie"];
        }
        if (res.headers["content-type"]) {
            resHeaders["content-type"] = String(res.headers["content-type"]);
        }
        if (res.headers["content-disposition"]) {
            resHeaders["content-disposition"] = String(res.headers["content-disposition"]);
        }
        if (res.headers["content-length"]) {
            resHeaders["content-length"] = String(res.headers["content-length"]);
        }
        return {
            data: responseData,
            status: res.status,
            headers: resHeaders,
        };
    }
    async fetchPublicLogins(ids) {
        const secret = this.config.get("gateway.secret");
        if (!secret) {
            return new Map();
        }
        const uniq = [...new Set(ids)].filter(Boolean).slice(0, 100);
        if (uniq.length === 0) {
            return new Map();
        }
        const authBase = this.bases.auth;
        const res = await axios_1.default.post(`${authBase}/auth/users/public-batch`, { ids: uniq }, {
            headers: {
                "Content-Type": "application/json",
                "x-gateway-secret": secret,
            },
            validateStatus: () => true,
        });
        if (res.status !== 200 || !res.data?.users) {
            return new Map();
        }
        return new Map(res.data.users.map((u) => [u.userId, u.login]));
    }
};
exports.ProxyService = ProxyService;
exports.ProxyService = ProxyService = ProxyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ProxyService);
//# sourceMappingURL=proxy.service.js.map