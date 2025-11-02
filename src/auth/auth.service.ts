import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login-dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';
import { CryptoService } from './services/crypto.service';
import {
  InvalidCredentialsException,
  EmailAlreadyExistsException,
  AuthDatabaseException
} from './exceptions/index';


@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private readonly userRepositoy:Repository<User>,
        private readonly jwtService: JwtService,
        private readonly cryptoService: CryptoService
    ){}
    
    async register( registerDto:RegisterDto ): Promise<RegisterResponseDto> {
        const {email, password, ...registerDetail} = registerDto;

        try {
            const existingUser = await this.userRepositoy.findOne({ where: { email } });
            if (existingUser) throw new EmailAlreadyExistsException(email);

            const newUser = this.userRepositoy.create({
                ...registerDto,
                password: this.cryptoService.hashPasswordSync(password),
                isEmailVerified: true,
                isActive: true
            });
            const savedUser = await this.userRepositoy.save(newUser);

            const { password: _, ...userWithoutPassword } = savedUser;

            return {
                ...userWithoutPassword,
                token: this.generateTokenJwt({id: savedUser.id}),
                message: 'User registered successfully'
            };

        } catch (error) {
            this.handdleErrorsDb(error);
        }
    }

    async verifyEmail(_email: string, _code: string): Promise<{ message: string; verified: boolean }> {
        // TODO: Implementar verificación de email
        throw new InternalServerErrorException('Email verification not implemented yet');
    }

    async resendVerificationEmail(_email: string): Promise<{ message: string }> {
        // TODO: Implementar reenvío de email de verificación
        throw new InternalServerErrorException('Resend verification email not implemented yet');
    }

    
    async login( loginDto: LoginDto ): Promise<LoginResponseDto> {
        const {email, password} = loginDto;

        const user = await this.userRepositoy.findOne({
            where: {email},
            select: {id: true, password: true, email: true, name: true, lastName: true}
        });

        if(!user)
            throw new InvalidCredentialsException();

        this.cryptoService.validatePasswordSync(password, user.password);

        const { password: _, ...userWithoutPassword } = user;

        return {
            ...userWithoutPassword,
            token: this.generateTokenJwt({id: user.id})
        };
    }

    async googleLogin(googleLoginDto: GoogleLoginDto): Promise<LoginResponseDto> {
        // TODO: Implementar login con Google
        throw new InternalServerErrorException('Google login not implemented yet');
    }



    private generateTokenJwt(payload:JwtPayload){
        return this.jwtService.sign(payload);
    }

    private handdleErrorsDb(error: any): never {
        // Si es una excepción de NestJS, re-lanzarla
        if (error instanceof EmailAlreadyExistsException ||
            error instanceof InvalidCredentialsException ||
            error instanceof InternalServerErrorException) {
            throw error;
        }

        // Verificar si es un error de PostgreSQL
        if (error.code) {
            if (error.code === '23505') {
                throw new EmailAlreadyExistsException(error.detail || 'unknown email');
            }

            if (error.code === '23503') {
                throw new AuthDatabaseException('crear usuario', 'Referencia inválida en la base de datos');
            }
        }

        throw new AuthDatabaseException('operación de autenticación', error.message);
    }



}
