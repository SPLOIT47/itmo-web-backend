import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

@Injectable()
export class GatewaySecretGuard implements CanActivate {
    constructor(private readonly config: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const expected = this.config.get<string>("GATEWAY_SECRET");
        if (!expected) {
            throw new UnauthorizedException(
                "GATEWAY_SECRET is not configured on AuthService",
            );
        }
        const req = context.switchToHttp().getRequest<Request>();
        const raw = req.headers["x-gateway-secret"];
        const secret = Array.isArray(raw) ? raw[0] : raw;
        if (secret !== expected) {
            throw new UnauthorizedException("Invalid gateway secret");
        }
        return true;
    }
}
