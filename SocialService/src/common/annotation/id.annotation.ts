import { BadRequestException, createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const Id = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
  const raw = req.headers['x-user-id'];

  if (raw === undefined || raw === null) {
    throw new UnauthorizedException('X-User-Id header is missing');
  }
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new BadRequestException('Invalid X-User-Id header');
  }

  return raw;
});

