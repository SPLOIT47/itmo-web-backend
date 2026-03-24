export declare function shouldEnrichProfilePayload(fullPath: string, method: string): boolean;
export declare function extractProfileUserIds(data: unknown): string[];
export declare function mergeLoginsIntoProfiles(data: unknown, loginByUserId: Map<string, string>): unknown;
