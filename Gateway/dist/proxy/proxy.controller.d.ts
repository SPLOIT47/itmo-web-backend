import { Request, Response } from "express";
import { ProxyService } from "./proxy.service";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
export declare class ProxyController {
    private readonly proxy;
    private readonly config;
    private readonly jwt;
    private readonly jwtGuard;
    private readonly log;
    constructor(proxy: ProxyService, config: ConfigService, jwt: JwtService);
    handle(req: Request & {
        userId?: string;
    }, res: Response): Promise<void>;
}
