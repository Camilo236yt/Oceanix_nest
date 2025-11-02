import { Controller, Post, Body, UseFilters, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';
import { VerifyEmailCodeDto } from 'src/email-verification/dto/verify-email-code.dto';
import { CustomBadRequestFilter } from './filters/custom-bad-request.filter';
import { CookieHelper } from './utils/cookie.helper';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('login-dev')
  @UseFilters(CustomBadRequestFilter)
  async loginDev(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
      return await this.authService.login(loginDto);
  }

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

  @Post('verify-email')
  verifyEmail(@Body() verifyEmailCodeDto: VerifyEmailCodeDto) {
    return this.authService.verifyEmail(verifyEmailCodeDto.email, verifyEmailCodeDto.code);
  }

  @Post('resend-verification')
  resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    CookieHelper.clearAuthCookie(res);
    return { message: 'Logout exitoso' };
  }

}
