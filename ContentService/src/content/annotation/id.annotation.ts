import { createParamDecorator, UnauthorizedException } from "@nestjs/common";

export const Id = createParamDecorator((_, context) => {
    const req = context.switchToHttp().getRequest();
    const id = req.headers["x-user-id"];

    if (!id || typeof id !== "string") {
        throw new UnauthorizedException("Missing X-User-Id header");
    }

    return id;
});

