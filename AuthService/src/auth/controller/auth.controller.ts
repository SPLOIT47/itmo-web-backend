import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Put,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from "@nestjs/common";
import { AuthService } from "../service/auth.service";
import { RegisterRequest } from "../payload/request/register.request";
import { LoginRequest } from "../payload/request/login.request";
import { UpdateCredentialsRequest } from "../payload/request/update.request";
import { UserPayload } from "../payload/UserPayload";
import { Id } from "../annotation/id.annotation";
import express from "express";
import { ConfigService } from "@nestjs/config";
import { AuthResponse } from "../payload/response/auth.response";
import { RefreshResponse } from "../payload/response/refreshResponse";
import ms, { StringValue } from "ms";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MeResponse } from "../payload/response/me.response";
import { GatewaySecretGuard } from "../gateway/gateway-secret.guard";
import { PublicBatchUserIdsRequest } from "../payload/request/public-batch-users.request";

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
    @HttpCode(HttpStatus.OK)
    async logoutAll(@Id() userId: string, @Res({ passthrough: true }) res: express.Response): Promise<void> {
        await this.authService.logoutAll(userId);
        this.clearRefreshCookie(res);
    }

    @Put('update')
    @HttpCode(HttpStatus.OK)
    async update(@Id() userId: string, @Body() request: UpdateCredentialsRequest): Promise<UserPayload> {
        return this.authService.updateCredentials(userId, request);
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    async getMe(@Id() userId: string): Promise<MeResponse> {
        return this.authService.getCurrent(userId);
    }

    @Post('users/public-batch')
    @HttpCode(HttpStatus.OK)
    @UseGuards(GatewaySecretGuard)
    @ApiOperation({
        summary:
            "Resolve public logins by user ids (Gateway BFF only; requires X-Gateway-Secret)",
    })
    async publicBatch(
        @Body() body: PublicBatchUserIdsRequest,
    ): Promise<{ users: { userId: string; login: string }[] }> {
        return this.authService.getPublicLoginsByIds(body.ids);
    }

    @Delete('me')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteMe(@Id() userId: string, @Res({ passthrough: true }) res: express.Response): Promise<void> {
        await this.authService.deleteAccount(userId);
        this.clearRefreshCookie(res);
    }

    private setRefreshCookie(res: express.Response, refreshToken: string) {
        const ttl = this.config.get("REFRESH_TOKEN_TTL")! as StringValue;
        const secure = this.config.get('COOKIE_SECURE') === 'true';

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: secure,
            sameSite: "lax",
            path: "/",
            maxAge: ms(ttl)
        })
    }

    private clearRefreshCookie(res: express.Response) {
        res.clearCookie("refreshToken", { path: "/" });
    }
}