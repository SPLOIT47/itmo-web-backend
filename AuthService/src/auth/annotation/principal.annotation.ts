import {createParamDecorator, ExecutionContext} from "@nestjs/common";
import {JwtPayload} from "../payload/JwtPayload";

export const Principal = createParamDecorator(
    (_: unknown, context: ExecutionContext): JwtPayload => {
        const request = context.switchToHttp().getRequest();
        return request.user;
    },
);