import { Controller, Get, Post, Body, Catch, ArgumentsHost, ExceptionFilter, HttpException, HttpStatus, UseFilters, Res, UseGuards, Req } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from './interfaces/request-with-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';
import { VerifyEmailCodeDto } from 'src/email-verification/dto/verify-email-code.dto';

// Filtro global solo para este controlador
@Catch(HttpException)
export class CustomBadRequestFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    if (status === HttpStatus.BAD_REQUEST) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        message: 'Credenciales invalidas',
        error: 'Bad Request',
      });
    } else {
      response.status(status).json(exception.getResponse());
    }
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<RegisterResponseDto, 'token'>> {
    const result = await this.authService.register(registerDto);
    // Establecer cookie HttpOnly con el token
    res.cookie('authToken', result.token, {
      httpOnly: true,
      secure: true, // Siempre HTTPS ya que estás en producción
      sameSite: 'none', // Necesario para cross-domain en producción
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      domain: '.forif.co', // Permite compartir entre subdominios
    });

    // Remover token del response
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
    // Establecer cookie HttpOnly con el token
    res.cookie('authToken', result.token, {
      httpOnly: true,
      secure: true, // Siempre HTTPS ya que estás en producción
      sameSite: 'none', // Necesario para cross-domain en producción
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      domain: '.forif.co', // Permite compartir entre subdominios
    });

    // Remover token del response
    const { token, ...responseWithoutToken } = result;
    return responseWithoutToken;
  }

  @Post('login-dev')
  @UseFilters(CustomBadRequestFilter)
  async loginDev(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    // Login para desarrollo - devuelve el token en el body
    return await this.authService.login(loginDto);
  }

  @Post('google-login')
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<LoginResponseDto, 'token'>> {
    const result = await this.authService.googleLogin(googleLoginDto);
    
    // Establecer cookie HttpOnly con el token
    res.cookie('authToken', result.token, {
      httpOnly: true,
      secure: true, // Siempre HTTPS ya que estás en producción
      sameSite: 'none', // Necesario para cross-domain en producción
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      domain: '.forif.co', // Permite compartir entre subdominios
    });

    // Remover token del response
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
    // Limpiar la cookie de autenticación
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.forif.co',
    });

    return { message: 'Logout exitoso' };
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  getStatus(@Req() req: RequestWithUser) {
    const user = req.user;
    
    // Extraer roles y permisos de forma segura
    const userRoles = user.roles?.map((userRole: any) => ({
      id: userRole.role?.id,
      name: userRole.role?.name,
      permissions: userRole.role?.permissions?.map((rolePermission: any) => ({
        id: rolePermission.permission?.id,
        name: rolePermission.permission?.name,
        title: rolePermission.permission?.title
      })).filter((p: any) => p.name) || []
    })).filter((role: any) => role.name) || [];
    
    // Crear lista plana de permisos únicos
    const allPermissions = new Set<string>();
    userRoles.forEach((role: any) => {
      role.permissions.forEach((permission: any) => {
        if (permission.name) {
          allPermissions.add(permission.name);
        }
      });
    });
    
    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        roles: userRoles,
        permissions: Array.from(allPermissions),
        redirectTo: this.determineRedirection(user)
      }
    };
  }

  private determineRedirection(user: any): 'app' | 'crm' {
    if (user.roles && user.roles.length > 0) {
      const hasValidRoles = user.roles.some((userRole: any) => 
        userRole.role && userRole.role.name
      );
      
      if (hasValidRoles) {
        return 'crm';
      }
    }
    
    return 'app';
  }

}
