import { CanActivate, ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
export declare class JwtAuthGuard implements CanActivate {
    private readonly jwtService;
    private readonly config;
    constructor(jwtService: JwtService, config: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
