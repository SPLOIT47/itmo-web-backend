import {
  All,
  Logger,
  Req,
  Res,
  Controller,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ProxyService } from "./proxy.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  extractProfileUserIds,
  mergeLoginsIntoProfiles,
  shouldEnrichProfilePayload,
} from "./profile-enrichment";

const PROTECTED_PREFIXES = [
  "/api/auth/me",
  "/api/auth/update",
  "/api/auth/logoutAll",
  /** не `/api/feed/` — иначе `startsWith(prefix + "/")` даёт `/api/feed//` и /api/feed/me не попадает под guard */
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

function needsAuth(path: string): boolean {
  const normalized = path.replace(/\?.*$/, "");
  return PROTECTED_PREFIXES.some(
    (p) => normalized === p || normalized.startsWith(p + "/"),
  );
}

@Controller("api")
export class ProxyController {
  private readonly jwtGuard: JwtAuthGuard;
  private readonly log = new Logger(ProxyController.name);

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.jwtGuard = new JwtAuthGuard(this.jwt, this.config);
  }

  @All("*")
  async handle(
    @Req() req: Request & { userId?: string },
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const rawUrl = req.originalUrl ?? req.url;
    const [pathname, queryString] = rawUrl.split("?");
    const fullPath = pathname.startsWith("/api") ? pathname : `/api${pathname}`;
    const query = queryString;
    this.log.log(
      `incoming ${req.method} ${fullPath}${query ? `?${query}` : ""} hasAuth=${!!req.headers.authorization}`,
    );

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
      } as unknown as import("@nestjs/common").ExecutionContext;
      try {
        await this.jwtGuard.canActivate(ctx);
        this.log.log(`auth ok path=${fullPath} userId=${req.userId ?? "n/a"}`);
      } catch (e) {
        if (e instanceof UnauthorizedException) {
          res.status(401).json({ message: e.message });
          return;
        }
        throw e;
      }
    }

    // Special-case: account deletion must orchestrate cleanup across services.
    if (req.method === "DELETE" && fullPath === "/api/auth/me") {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Missing userId" });
        return;
      }

      await this.proxy.forward(
        "DELETE",
        "/api/auth/me",
        req.headers,
        undefined,
        undefined,
        userId,
      );

      await this.proxy.forward(
        "DELETE",
        "/api/profiles/me",
        req.headers,
        undefined,
        undefined,
        userId,
      );

      await this.proxy.forward(
        "DELETE",
        "/api/posts/me",
        req.headers,
        undefined,
        undefined,
        userId,
      );

      await this.proxy.forward(
        "DELETE",
        "/api/friends/me",
        req.headers,
        undefined,
        undefined,
        userId,
      );

      await this.proxy.forward(
        "DELETE",
        "/api/communities/me/members",
        req.headers,
        undefined,
        undefined,
        userId,
      );

      await this.proxy.forward(
        "DELETE",
        "/api/feed/me",
        req.headers,
        undefined,
        undefined,
        userId,
      );

      await this.proxy.forward(
        "DELETE",
        "/api/media/me",
        req.headers,
        undefined,
        undefined,
        userId,
      );

      res.status(204).end();
      return;
    }

    const contentType = String(req.headers["content-type"] ?? "").toLowerCase();
    const isMultipart = contentType.includes("multipart/form-data");

    let body: unknown = undefined;
    if (
      !isMultipart &&
      req.method !== "GET" &&
      req.method !== "HEAD" &&
      req.body !== undefined
    ) {
      body = req.body;
    }

    const result = await this.proxy.forward(
      req.method,
      fullPath,
      req.headers,
      body,
      query,
      req.userId,
      isMultipart ? req : undefined,
    );
    this.log.log(
      `outgoing ${req.method} ${fullPath} status=${result.status} ct=${result.headers["content-type"] ?? ""}`,
    );

    let responseData = result.data;
    if (
      responseData &&
      typeof responseData === "object" &&
      "accessToken" in responseData &&
      (fullPath === "/api/auth/login" || fullPath === "/api/auth/register")
    ) {
      responseData = { ...responseData, token: (responseData as { accessToken: string }).accessToken };
    }

    if (
      result.status === 200 &&
      responseData !== undefined &&
      shouldEnrichProfilePayload(fullPath, req.method)
    ) {
      const ids = extractProfileUserIds(responseData);
      if (ids.length > 0) {
        const loginMap = await this.proxy.fetchPublicLogins(ids);
        responseData = mergeLoginsIntoProfiles(responseData, loginMap);
      }
    }

    Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v));
    res.status(result.status);
    if (result.status === 204 || responseData === undefined) {
      res.end();
    } else if (Buffer.isBuffer(responseData)) {
      res.send(responseData);
    } else {
      res.json(responseData);
    }
  }
}
