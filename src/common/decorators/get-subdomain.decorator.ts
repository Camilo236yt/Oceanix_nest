import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador que extrae el subdomain del request
 * El subdomain es agregado por el SubdomainMiddleware
 *
 * @example
 * ```typescript
 * @Post('login')
 * async login(
 *   @Body() loginDto: LoginDto,
 *   @GetSubdomain() subdomain: string
 * ) {
 *   return this.authService.login(loginDto, subdomain);
 * }
 * ```
 *
 * @returns El subdomain extraído del host (ej: 'empresa1' de 'empresa1.oceanix.space')
 *          o undefined si no hay subdomain (ej: 'oceanix.space', 'localhost')
 */
export const GetSubdomain = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request['subdomain'];
  },
);
