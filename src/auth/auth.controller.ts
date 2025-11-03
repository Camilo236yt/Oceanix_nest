import { Controller, Post, Body, UseFilters, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterEnterpriseDto } from './dto/register-enterprise.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';
import { VerifyEmailCodeDto } from 'src/email-verification/dto/verify-email-code.dto';
import { CustomBadRequestFilter } from './filters/custom-bad-request.filter';
import { CookieHelper } from './utils/cookie.helper';
import {
  AuthApiTags,
  RegisterDoc,
  LoginDoc,
  LoginDevDoc,
  GoogleLoginDoc,
  VerifyEmailDoc,
  ResendVerificationDoc,
  LogoutDoc,
} from './docs';
import { RegisterEnterpriseDoc } from '../enterprise/docs';

@AuthApiTags()
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @RegisterEnterpriseDoc()
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Post('register-enterprise')
  async registerEnterprise(
    @Body() registerDto: RegisterEnterpriseDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.registerEnterprise(registerDto);
    CookieHelper.setAuthCookie(res, result.token);

    const { token, ...responseWithoutToken } = result;
    return responseWithoutToken;
  }

  @RegisterDoc()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<RegisterResponseDto, 'token'>> {
    const result = await this.authService.register(registerDto);
    CookieHelper.setAuthCookie(res, result.token);

    const { token, ...responseWithoutToken } = result;
    return responseWithoutToken;
  }

  @LoginDoc()
  @Post('login')
  @UseFilters(CustomBadRequestFilter)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<LoginResponseDto, 'token'>> {
    const result = await this.authService.login(loginDto);
    CookieHelper.setAuthCookie(res, result.token);

    const { token, ...responseWithoutToken } = result;
    return responseWithoutToken;
  }

  @LoginDevDoc()
  @Post('login-dev')
  @UseFilters(CustomBadRequestFilter)
  async loginDev(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
      return await this.authService.login(loginDto);
  }

  @GoogleLoginDoc()
  @Post('google-login')
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<LoginResponseDto, 'token'>> {
    const result = await this.authService.googleLogin(googleLoginDto);
    CookieHelper.setAuthCookie(res, result.token);

    const { token, ...responseWithoutToken } = result;
    return responseWithoutToken;
  }

  @VerifyEmailDoc()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @Post('verify-email')
  verifyEmail(@Body() verifyEmailCodeDto: VerifyEmailCodeDto) {
    return this.authService.verifyEmail(verifyEmailCodeDto.email, verifyEmailCodeDto.code);
  }

  @ResendVerificationDoc()
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('resend-verification')
  resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @LogoutDoc()
  @SkipThrottle()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    CookieHelper.clearAuthCookie(res);
    return { message: 'Logout exitoso' };
  }

}
