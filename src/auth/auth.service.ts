import * as bcrypt from 'bcrypt';

import { Injectable, UnauthorizedException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserProfile } from 'src/users/entities/user-profile.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login-dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthResponseDto, LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { OAuth2Client } from 'google-auth-library';
import { EmailVerificationService } from 'src/email-verification/email-verification.service';
import { EmailQueueService } from 'src/email-queue/email-queue.service';


@Injectable()
export class AuthService implements OnModuleInit {
    private googleClient: OAuth2Client;

    constructor(
        @InjectRepository(User)
        private readonly userRepositoy:Repository<User>,
        @InjectRepository(UserProfile)
        private readonly userProfileRepository:Repository<UserProfile>,
        private readonly configService:ConfigService,
        private readonly jwtService: JwtService,
        private readonly emailVerificationService: EmailVerificationService,
        private readonly emailQueueService: EmailQueueService
    ){
        // Inicializar Google OAuth2 Client
        this.googleClient = new OAuth2Client('909199431789-7p2vqeuum33204206d3d667b8s31gm4h.apps.googleusercontent.com');
    }

    onModuleInit() {
        // Inicializar Firebase Admin si no está ya inicializado
        if (!admin.apps.length) {
            try {
                const bucketName = this.configService.get<string>('FIREBASE_BUCKET');
                
                // Use environment variables instead of JSON file
                const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
                
                // Handle private key formatting - ensure proper PEM format
                let formattedPrivateKey = privateKey;
                if (privateKey) {
                    // More robust cleaning: remove all quotes, normalize escaping
                    formattedPrivateKey = privateKey
                        .replace(/^['"]|['"]$/g, '') // Remove surrounding quotes (single or double)
                        .replace(/\\\\n/g, '\n') // Convert double-escaped newlines
                        .replace(/\\n/g, '\n') // Convert escaped newlines
                        .replace(/\\\\/g, '\\') // Convert double-escaped backslashes
                        .trim();
                }

                const serviceAccount = {
                    type: this.configService.get<string>('FIREBASE_TYPE'),
                    project_id: this.configService.get<string>('FIREBASE_PROJECT_ID'),
                    private_key_id: this.configService.get<string>('FIREBASE_PRIVATE_KEY_ID'),
                    private_key: formattedPrivateKey,
                    client_email: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
                    client_id: this.configService.get<string>('FIREBASE_CLIENT_ID'),
                    auth_uri: this.configService.get<string>('FIREBASE_AUTH_URI'),
                    token_uri: this.configService.get<string>('FIREBASE_TOKEN_URI'),
                    auth_provider_x509_cert_url: this.configService.get<string>('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
                    client_x509_cert_url: this.configService.get<string>('FIREBASE_CLIENT_X509_CERT_URL'),
                    universe_domain: this.configService.get<string>('FIREBASE_UNIVERSE_DOMAIN')
                };

                if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
                    throw new Error('Firebase credentials not properly configured in environment variables');
                }
                
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
                    storageBucket: bucketName,
                });
            } catch (error) {
                throw new InternalServerErrorException('Error initializing Firebase Admin');
            }
        }
    }
    
    async register( registerDto:RegisterDto ): Promise<RegisterResponseDto> {
        const {email, password, ...registerDetail} = registerDto;

        try {
            // 🔒 SEGURIDAD: Verificación de email duplicado va directamente a DB
            // No usamos cache para validaciones de registro por seguridad
            const existingUser = await this.userRepositoy.findOne({ where: { email } });
            if (existingUser) {
                throw new UnauthorizedException('El email ya está registrado');
            }

            const user = await this.userRepositoy.create({
                ...registerDto,
                password: bcrypt.hashSync(password, 10),
                isEmailVerified: false // Nuevo campo para verificación
            });
            await this.userRepositoy.save(user);
            
            // Enviar código de verificación por email en background
            await this.emailQueueService.sendVerificationEmail(
                user.email, 
                user.name || user.email
            );

            return this.buildRegisterResponse(user);
            
        } catch (error) {
            // Si es una excepción de NestJS que ya lanzamos, la re-lanzamos
            if (error instanceof UnauthorizedException || 
                error instanceof InternalServerErrorException) {
                throw error;
            }
            
            // Si es un error de base de datos, lo procesamos
            this.handdleErrorsDb(error);
        }

    }

    async verifyEmail(email: string, code: string): Promise<{ message: string; verified: boolean }> {
        try {
            // Verificar el código
            const isValid = await this.emailVerificationService.verifyEmailCode(email, code);
            
            if (isValid) {
                // Actualizar el usuario para marcarlo como verificado y activado
                await this.userRepositoy.update(
                    { email },
                    { isEmailVerified: true, isActive: true }
                );
                
                return {
                    message: 'Email verificado exitosamente',
                    verified: true
                };
            }
            
            return {
                message: 'Código de verificación inválido',
                verified: false
            };
            
        } catch (error) {
            throw new UnauthorizedException('Error al verificar el email');
        }
    }

    async resendVerificationEmail(email: string): Promise<{ message: string }> {
        try {
            const user = await this.userRepositoy.findOne({ where: { email } });
            
            if (!user) {
                throw new UnauthorizedException('Usuario no encontrado');
            }
            
            if (user.isEmailVerified) {
                throw new UnauthorizedException('El email ya está verificado');
            }
            
            await this.emailQueueService.resendVerificationEmail(
                user.email,
                user.name || user.email
            );
            
            return {
                message: 'Código de verificación reenviado exitosamente'
            };
            
        } catch (error) {
            throw new UnauthorizedException('Error al reenviar el código de verificación');
        }
    }

    
    // todo: crear logica del login
    async login( loginDto: LoginDto ): Promise<LoginResponseDto> {

        const {email, password} = loginDto;

        // 🔒 SEGURIDAD: Login SIEMPRE consulta directamente la DB (NO cache)
        // Esto garantiza datos actualizados de contraseña, estado, roles, etc.
        const user = await this.userRepositoy.findOne({
            where: {email},
            select: {id: true, password: true, email: true, name: true, lastName: true},
            relations: ['roles', 'roles.role', 'roles.role.permissions', 'roles.role.permissions.permission', 'profile']
        });

        if(!user)
                throw new UnauthorizedException('Invalid credentials');
        
        if( !bcrypt.compareSync(password, user.password) )
            throw new UnauthorizedException('Invalid credentials');

        return this.buildLoginResponse(user);

    }

    async googleLogin(googleLoginDto: GoogleLoginDto): Promise<LoginResponseDto> {
        const { idToken } = googleLoginDto;

        try {
            // Verificar el token de Google con Google Auth Library
            const ticket = await this.googleClient.verifyIdToken({
                idToken: idToken,
                audience: '909199431789-7p2vqeuum33204206d3d667b8s31gm4h.apps.googleusercontent.com',
            });

            const payload = ticket.getPayload();
            const { email, name, picture, sub: uid } = payload || {};

            if (!email) {
                throw new UnauthorizedException('Google token does not contain email');
            }
            // Buscar si el usuario ya existe
            let user = await this.userRepositoy.findOne({
                where: { email },
                relations: ['roles', 'roles.role', 'roles.role.permissions', 'roles.role.permissions.permission', 'profile']
            });

            // Si no existe, crear nuevo usuario
            if (!user) {
                const userName = name || email.split('@')[0];
                const newUser = this.userRepositoy.create({
                    email,
                    name: userName,
                    lastName: '',
                    phoneNumber: '',
                    password: '', // No necesita password para login con Google
                    isActive: true,
                    isEmailVerified: true // Google ya verificó el email
                });

                // Guardar usuario
                user = await this.userRepositoy.save(newUser);

                // Crear perfil con Google ID y foto
                const userProfile = this.userProfileRepository.create({
                    userId: user.id,
                    googleId: uid,
                    profilePicture: picture || this.generateDefaultAvatar(userName, '')
                });

                await this.userProfileRepository.save(userProfile);
            } else {
                // Actualizar googleId si no existe en el perfil
                if (!user.profile?.googleId) {
                    if (user.profile) {
                        user.profile.googleId = uid;
                        await this.userProfileRepository.save(user.profile);
                    } else {
                        // Crear perfil si no existe
                        const userProfile = this.userProfileRepository.create({
                            userId: user.id,
                            googleId: uid,
                            profilePicture: picture || this.generateDefaultAvatar(user.name, user.lastName)
                        });
                        await this.userProfileRepository.save(userProfile);
                    }
                }
            }

            return this.buildLoginResponse(user!);

        } catch (error) {
            
            if (error.code === 'auth/id-token-expired') {
                throw new UnauthorizedException('Google token has expired');
            }
            if (error.code === 'auth/invalid-id-token') {
                throw new UnauthorizedException('Invalid Google token');
            }
            if (error.code === 'auth/project-not-found') {
                throw new InternalServerErrorException('Firebase project not configured correctly');
            }
            
            // Si es un error de autenticación que ya lanzamos, no lo envolvemos
            if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
                throw error;
            }
            
            throw new InternalServerErrorException(`Error processing Google login: ${error.message}`);
        }
    }



    private generateTokenJwt(payload:JwtPayload){
        return this.jwtService.sign(payload);
    }

    /**
     * Construye la respuesta sanitizada para el login
     */
    private buildLoginResponse(user: User): LoginResponseDto {
        const redirectTo = this.determineRedirection(user);

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            token: this.generateTokenJwt({id: user.id}),
            redirectTo
        };
    }


    /**
     * Construye la respuesta sanitizada para el registro
     */
    private buildRegisterResponse(user: User): RegisterResponseDto {
        const redirectTo = this.determineRedirection(user);

        return {
            id: user.id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            isActive: user.isActive ?? false,
            token: this.generateTokenJwt({id: user.id}),
            message: 'User registered successfully',
            redirectTo
        };
    }


    /**
     * Extrae los permisos únicos del usuario
     */
    private extractPermissions(user: User): string[] {
        if (!user.roles) return [];
        
        const permissions = new Set<string>();
        
        user.roles.forEach(userRole => {
            userRole.role?.permissions?.forEach(rolePermission => {
                if (rolePermission.permission?.name) {
                    permissions.add(rolePermission.permission.name);
                }
            });
        });
        
        return Array.from(permissions);
    }

    /**
     * Método auxiliar para obtener respuesta sanitizada de usuario
     */
    private buildUserResponse(user: User): AuthResponseDto {
        const redirectTo = this.determineRedirection(user);

        return {
            id: user.id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            isActive: user.isActive ?? false,
            token: this.generateTokenJwt({id: user.id}),
            redirectTo
        };
    }

    /**
     * Determina a dónde debe ser redirigido el usuario basado en sus roles
     */
    private determineRedirection(user: User): 'app' | 'crm' {
        // Si el usuario tiene roles, va al CRM (dashboard administrativo)
        if (user.roles && user.roles.length > 0) {
            const hasValidRoles = user.roles.some(userRole => 
                userRole.role && userRole.role.name
            );
            
            if (hasValidRoles) {
                return 'crm';
            }
        }
        
        // Si no tiene roles, va a la app de usuarios estándar
        return 'app';
    }

    /**
     * Genera una URL de avatar por defecto basada en el nombre del usuario
     */
    private generateDefaultAvatar(name: string, lastName: string = ''): string {
        const fullName = `${name} ${lastName}`.trim();
        const encodedName = encodeURIComponent(fullName);
        
        // Generar color de fondo basado en el hash del nombre
        const colors = ['0ea5e9', '8b5cf6', 'f59e0b', 'ef4444', '10b981', 'f97316', '6366f1', 'ec4899'];
        const colorIndex = Math.abs(this.hashString(fullName)) % colors.length;
        const backgroundColor = colors[colorIndex];
        
        return `https://ui-avatars.com/api/?name=${encodedName}&background=${backgroundColor}&color=fff&size=200&bold=true&rounded=true`;
    }

    /**
     * Genera un hash simple de un string para seleccionar colores consistentes
     */
    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    private handdleErrorsDb(error: any): never {
        // Verificar si es un error de PostgreSQL
        if (error.code) {
            if (error.code === '23505') {
                throw new UnauthorizedException('El email ya está registrado');
            }

            if (error.code === '23503') {
                throw new UnauthorizedException('Referencia inválida en la base de datos');
            }
        }

        throw new InternalServerErrorException('Error interno del servidor');
    }



}
