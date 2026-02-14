export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

export interface TokensWithMeta extends Tokens {
    refreshExpiresAt: Date;
}