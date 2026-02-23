import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException
} from "@nestjs/common";
import {TxService} from "../../common/tx/service/tx.service";
import {JwtService} from "@nestjs/jwt";
import {UserRepository} from "../repository/user.repository";
import {RefreshTokenRepository} from "../repository/refreshToken.repository";
import {OutboxRepository} from "../../outbox/repository/outbox.repository";
import {RegisterRequest} from "../payload/request/register.request";
import {PasswordHasher} from "../../common/crypto/passwordHasher";
import {JwtPayload} from "../payload/JwtPayload";
import {Tokens, TokensWithMeta} from "../model/Tokens";
import {ConfigService} from "@nestjs/config";
import {TokenHasher} from "../../common/crypto/tokenHasher";
import {LoginRequest} from "../payload/request/login.request";
import {UpdateCredentialsRequest} from "../payload/request/update.request";
import {OutboxEventType, RefreshToken} from "@prisma/client";
import {UserPayload} from "../payload/UserPayload";
import ms, {StringValue} from "ms";
import {AuthResult} from "../model/AuthResult";
import {MeResponse} from "../payload/response/me.response";

@Injectable()
export class AuthService {

    constructor(
        private readonly configService: ConfigService,
        private readonly txService: TxService,
        private readonly jwtService: JwtService,
        private readonly userRepository: UserRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly outboxRepository: OutboxRepository,
    ) {}

    async register(payload: RegisterRequest) : Promise<AuthResult> {

        return this.txService.run(async db => {
           const exists =
               await this.userRepository.findByLogin(db, payload.login) != null ||
               await this.userRepository.findByEmail(db, payload.email) != null;

           if (exists) {
               throw new ConflictException("User already exists");
           }

           const userEntity = {
               login: payload.login,
               email: payload.email,
               passwordHash: await PasswordHasher.hash(payload.password),
           };

           const user = await this.userRepository.create(db, userEntity);

           const userPayload = {
               userId: user.userId,
               login: user.login,
               email: user.email,
               createdAt: user.createdAt,
           };

           await this.outboxRepository.create(db, OutboxEventType.USER_REGISTERED, userPayload);

           const jwtPayload: JwtPayload = {
               sub: user.userId,
               login: user.login,
               email: user.email,
           };

            const tokes = this.createTokens(jwtPayload);

            await this.refreshTokenRepository.create(db, {
                tokenHash: await TokenHasher.hash(tokes.refreshToken),
                expiresAt: tokes.refreshExpiresAt,
                user: { connect: { userId: user.userId }},
            })

            return {
                user: userPayload,
                tokens: tokes,
            }
        });
    }

    async login(payload: LoginRequest) : Promise<AuthResult> {
        const opt = await this.userRepository.findByLogin(this.txService.db(), payload.identifier)
        const user = opt != null ? opt : await this.userRepository.findByEmail(this.txService.db(), payload.identifier);
        const exists = user != null;

        if (!exists) throw new NotFoundException("User not found");

        const isValidPassword = await PasswordHasher.verify(payload.password, user.passwordHash);

        if (!isValidPassword) throw new UnauthorizedException("Invalid password");

        const jwtPayload: JwtPayload = {
            sub: user.userId,
            login: user.login,
            email: user.email,
        }

        const tokens = this.createTokens(jwtPayload);

        await this.txService.run(async db => {
            await this.refreshTokenRepository.create(db, {
                tokenHash: await TokenHasher.hash(tokens.refreshToken),
                expiresAt: tokens.refreshExpiresAt,
                user: {connect: {userId: user.userId}},
            });
        });

        return {
            user: {
                userId: user.userId,
                login: user.login,
                email: user.email,
                createdAt: user.createdAt,
            },
            tokens: tokens,
        };
    }

    async refresh(refreshToken: string): Promise<Tokens> {
        const payload = this.verifyRefresh(refreshToken);
        const userId = payload.sub;

        return this.txService.run(async db => {

            const storedTokens = await this.refreshTokenRepository.findActiveByUserId(db, userId);

            let current: RefreshToken | null = null;

            for (const t of storedTokens) {
                const match = await TokenHasher.verify(refreshToken, t.tokenHash);
                if (match) {
                    current = t;
                    break;
                }
            }

            if (!current) throw new UnauthorizedException("Refresh token not found");
            if (current.expiresAt.getTime() < Date.now())
                throw new UnauthorizedException("Refresh token expired");

            await this.refreshTokenRepository.revoke(db, current.refreshTokenId);

            const cleanPayload: JwtPayload = {
                sub: payload.sub,
                login: payload.login,
                email: payload.email,
            };

            const newTokens = this.createTokens(cleanPayload);

            await this.refreshTokenRepository.create(db, {
                tokenHash: await TokenHasher.hash(newTokens.refreshToken),
                expiresAt: newTokens.refreshExpiresAt,
                user: { connect: { userId } },
            });

            return {
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
            };
        });
    }

    async logout(refreshToken: string): Promise<void> {
        const payload = this.verifyRefresh(refreshToken);
        const userId = payload.sub;

        await this.txService.run(async db => {
            const stored = await this.refreshTokenRepository.findActiveByUserId(db, userId);

            let current: RefreshToken | null = null;
            for (const t of stored) {
                if (await TokenHasher.verify(refreshToken, t.tokenHash)) {
                    current = t;
                    break;
                }
            }

            if (!current) return;
            await this.refreshTokenRepository.revoke(db, current.refreshTokenId);
        });
    }

    async logoutAll(userId: string): Promise<void> {
        await this.txService.run(async db => {
            await this.refreshTokenRepository.revokeAllByUserId(db, userId);
        });
    }

    async updateCredentials(userId: string, payload: UpdateCredentialsRequest) : Promise<UserPayload> {
        return await this.txService.run(async db => {
            const user = await this.userRepository.findById(db, userId);
            if (!user) throw new UnauthorizedException();

            if (payload.login && payload.login !== user.login) {
                const exists = await this.userRepository.findByLogin(db, payload.login);
                if (exists) throw new ConflictException("login already in use");
            }

            if (payload.email && payload.email !== user.email) {
                const exists = await this.userRepository.findByEmail(db, payload.email);
                if (exists) throw new ConflictException("email already in use");
            }

            let newPasswordHash: string | undefined;
            if (payload.newPassword) {
                if (!payload.currentPassword) throw new BadRequestException("currentPassword are required to change password");

                const m = await PasswordHasher.verify(payload.currentPassword, user.passwordHash);
                if (!m) throw new UnauthorizedException("wrong password");

                newPasswordHash = await PasswordHasher.hash(payload.newPassword);
            }

            if (!payload.login && !payload.email && !payload.newPassword) throw new BadRequestException("cannot update credentials with empty payload");


            await this.userRepository.update(db, userId, {
                ...(payload.login ? { login: payload.login } : {}),
                ...(payload.email ? { email: payload.email } : {}),
                ...(newPasswordHash ? { passwordHash: newPasswordHash } : {}),
            });

            if (newPasswordHash) {
                await this.refreshTokenRepository.revokeAllByUserId(db, userId);
            }

            const updated = await this.userRepository.findById(db, userId);

            if (!updated) throw new InternalServerErrorException();

            const userPayload: UserPayload = {
                userId: updated.userId,
                login: updated.login,
                email: updated.email,
                createdAt: updated.createdAt,
            };

            if (payload.login || payload.email) {
                await this.outboxRepository.create(db, OutboxEventType.USER_CREDENTIALS_UPDATED, userPayload)
            }

            return userPayload;
        });
    }

    async getCurrent(userId: string): Promise<MeResponse> {
        const user = await this.userRepository.findById(this.txService.db(), userId);
        if (!user) throw new NotFoundException("User not found");
        return {
            userId: user.userId,
            login: user.login,
            email: user.email,
        };
    }

    private createTokens(payload: JwtPayload): TokensWithMeta {
        const accessToken = this.jwtService.sign(payload);

        const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
        const refreshTokenTtl = this.configService.get('REFRESH_TOKEN_TTL') as StringValue;
        const refreshToken = this.jwtService.sign(payload, {
            secret : refreshTokenSecret,
            expiresIn: refreshTokenTtl,
        });

        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
            refreshExpiresAt: new Date(Date.now() + ms(refreshTokenTtl)),
        }
    }

    private verifyRefresh(refreshToken: string): JwtPayload {
        const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
        try {
            return this.jwtService.verify<JwtPayload>(refreshToken, {secret: refreshTokenSecret});
        } catch (error) {
            throw new UnauthorizedException("refresh token is invalid");
        }
    }
}