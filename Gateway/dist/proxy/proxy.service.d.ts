import { ConfigService } from "@nestjs/config";
import { IncomingHttpHeaders, IncomingMessage } from "http";
export declare class ProxyService {
    private readonly config;
    private readonly bases;
    private readonly log;
    constructor(config: ConfigService);
    private getBaseUrl;
    forward(method: string, apiPath: string, headers: IncomingHttpHeaders, body?: unknown, query?: string, userId?: string, rawBody?: IncomingMessage): Promise<{
        data: unknown;
        status: number;
        headers: Record<string, string>;
    }>;
    fetchPublicLogins(ids: string[]): Promise<Map<string, string>>;
}
