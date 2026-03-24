import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    if (!token) {
      throw new UnauthorizedException("Missing or invalid Authorization header");
    }

    try {
      const secret = this.config.get<string>("jwt.accessTokenSecret");
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
        { secret },
      );
      (request as Request & { userId?: string }).userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
