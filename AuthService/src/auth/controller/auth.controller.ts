import {
    Body,
    Controller, Get,
    HttpCode,
    HttpStatus,
    Post,
    Put,
    Req,
    Res,
    UnauthorizedException,
    UseGuards
} from "@nestjs/common";
import {AuthService} from "../service/auth.service";
import {RegisterRequest} from "../payload/request/register.request";
import {LoginRequest} from "../payload/request/login.request";
import {UpdateCredentialsRequest} from "../payload/request/update.request";
import {UserPayload} from "../payload/UserPayload";
import {AuthGuard} from "@nestjs/passport";
import type {JwtPayload} from "../payload/JwtPayload";
import {Principal} from "../annotation/principal.annotation";
import express from "express";
import {ConfigService} from "@nestjs/config";
import {AuthResponse} from "../payload/response/auth.response";
import {RefreshResponse} from "../payload/response/refreshResponse";
import ms, {StringValue} from "ms";
import {ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {MeResponse} from "../payload/response/me.response";

@ApiTags("Auth")
@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService, private readonly config: ConfigService) {}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({ status: 201, type: AuthResponse })
    async register(@Body() request: RegisterRequest, @Res({passthrough: true}) res: express.Response): Promise<AuthResponse> {
        const out = await this.authService.register(request);
        this.setRefreshCookie(res, out.tokens.refreshToken);

        return {
            user: out.user,
            accessToken: out.tokens.accessToken,
        }
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, type: AuthResponse })
    async login(@Body() request: LoginRequest, @Res({passthrough: true}) res: express.Response): Promise<AuthResponse> {
        const out = await this.authService.login(request);
        this.setRefreshCookie(res, out.tokens.refreshToken);

        return {
            user: out.user,
            accessToken: out.tokens.accessToken,
        }
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, type: RefreshResponse })
    async refresh(@Req() req: express.Request, @Res({passthrough: true}) res: express.Response): Promise<RefreshResponse> {
        const cookie = req.cookies?.refreshToken;
        if (!cookie) throw new UnauthorizedException("No refresh cookie");

        const out = await this.authService.refresh(cookie);

        this.setRefreshCookie(res, out.refreshToken);
        return {
            accessToken: out.accessToken,
        }
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: express.Request, @Res({passthrough: true}) res: express.Response): Promise<void> {
        const cookie = req.cookies?.refreshToken;
        if (!cookie) throw new UnauthorizedException("No refresh cookie");

        await this.authService.logout(cookie);
        this.clearRefreshCookie(res);
    }

    @Post('logoutAll')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async logoutAll(@Principal() principal: JwtPayload, @Res({passthrough: true}) res: express.Response): Promise<void> {
        await this.authService.logoutAll(principal.sub);
        this.clearRefreshCookie(res);
    }

    @Put('update')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async update(@Principal() principal: JwtPayload, @Body() request: UpdateCredentialsRequest): Promise<UserPayload> {
        return this.authService.updateCredentials(principal.sub, request);
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async getMe(@Principal() principal: JwtPayload): Promise<MeResponse> {
        return this.authService.getCurrent(principal.sub);
    }

    private setRefreshCookie(res: express.Response, refreshToken: string) {
        const ttl = this.config.get("REFRESH_TOKEN_TTL")! as StringValue;
        const secure = this.config.get('COOKIE_SECURE') === 'true';

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: secure,
            sameSite: "lax",
            path: "/auth",
            maxAge: ms(ttl)
        })
    }

    private clearRefreshCookie(res: express.Response) {
        res.clearCookie("refreshToken", { path: "/auth" });
    }
}