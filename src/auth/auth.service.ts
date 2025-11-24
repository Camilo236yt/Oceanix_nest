import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

import { User, UserType } from 'src/users/entities/user.entity';
import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { RolePermission } from 'src/roles/entities/role-permission.entity';
import { UserRole } from 'src/users/entities/user-role.entity';
import { RegisterDto, RegisterEnterpriseDto, LoginDto, GoogleLoginDto } from './dto';
import { JwtPayload, AuthResponseDto, ActivationTokenPayload, RegisterEnterpriseResponseDto, UserProfileResponseDto } from './interfaces';
import { CryptoService, AuthValidationService } from './services';
import { InvalidCredentialsException, EmailAlreadyExistsException, AuthDatabaseException } from './exceptions';
import { EnterpriseConfigService } from '../enterprise-config/enterprise-config.service';


@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly googleClient: OAuth2Client;

    constructor(
        @InjectRepository(User)
        private readonly userRepositoy: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
        @InjectRepository(RolePermission)
        private readonly rolePermissionRepository: Repository<RolePermission>,
        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,
        private readonly dataSource: DataSource,
        private readonly jwtService: JwtService,
        private readonly cryptoService: CryptoService,
        private readonly authValidationService: AuthValidationService,
        private readonly configService: ConfigService,
        private readonly enterpriseConfigService: EnterpriseConfigService,
    ) {
        this.googleClient = new OAuth2Client(
            this.configService.get('GOOGLE_CLIENT_ID'),
        );
    }

    async register(registerDto: RegisterDto, subdomain: string): Promise<AuthResponseDto> {
        const { email, password, confirmPassword } = registerDto;

        try {
            // Validaciones
            this.authValidationService.validatePasswordConfirmation(password, confirmPassword);
            this.authValidationService.validateSubdomain(subdomain);
            const enterprise = await this.authValidationService.validateAndGetEnterprise(subdomain);
            await this.authValidationService.validateUserDoesNotExist(email, enterprise.id);

            // Remover campos no necesarios del DTO
            const { address: _, confirmPassword: __, ...userDataWithoutAddress } = registerDto;

            // Crear usuario CLIENT
            const hashedPassword = await this.cryptoService.hashPassword(password);
            const newUser = this.userRepositoy.create({
                ...userDataWithoutAddress,
                password: hashedPassword,
                userType: UserType.CLIENT,
                enterpriseId: enterprise.id,
                isEmailVerified: false,
                isActive: true
            });
            const savedUser = await this.userRepositoy.save(newUser);

            // Preparar respuesta
            const { password: _pass, ...userWithoutPassword } = savedUser;
            return {
                ...userWithoutPassword,
                token: this.generateTokenJwt({ id: savedUser.id }),
                message: 'Client registered successfully. Please verify your email.'
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

    /**
     * Activa una cuenta validando el token de activación
     * y generando el token de sesión para el subdomain correcto
     */
    async activateAccount(activationToken: string, subdomain?: string): Promise<AuthResponseDto> {
        try {
            // 1. Validar y decodificar el token de activación
            const payload = this.jwtService.verify<ActivationTokenPayload>(activationToken, {
                secret: this.configService.get('JWT_ACTIVATION_SECRET'),
            });

            // 2. Verificar que sea un token de activación
            if (payload.type !== 'ACTIVATION') {
                throw new InvalidCredentialsException();
            }

            // 3. Verificar que el subdomain coincida
            if (!subdomain || payload.subdomain !== subdomain) {
                throw new InvalidCredentialsException();
            }

            // 4. Obtener el usuario con su empresa
            const user = await this.userRepositoy.findOne({
                where: { id: payload.userId },
                select: { id: true, email: true, name: true, lastName: true, userType: true, enterpriseId: true },
                relations: { enterprise: true },
            });

            if (!user) {
                throw new InvalidCredentialsException();
            }

            // 5. Verificar que la empresa del usuario coincida con el subdomain
            if (!user.enterprise || user.enterprise.subdomain !== subdomain) {
                throw new InvalidCredentialsException();
            }

            // 6. Generar token de sesión normal
            const sessionToken = this.generateTokenJwt({ id: user.id });

            // 7. Retornar respuesta con token de sesión
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                lastName: user.lastName,
                token: sessionToken,
                message: 'Cuenta activada exitosamente',
            };
        } catch (error) {
            // Si el token es inválido, expiró, o cualquier error de validación
            this.logger.error(`Error activating account: ${error.message}`);
            throw new InvalidCredentialsException();
        }
    }

    async login(loginDto: LoginDto, subdomain?: string): Promise<AuthResponseDto> {
        const { email, password } = loginDto;

        const user = await this.userRepositoy.findOne({
            where: { email },
            select: {
                id: true,
                password: true,
                email: true,
                name: true,
                lastName: true,
                userType: true,
                enterpriseId: true,
                phoneNumber: true,
                addressId: true,
                identificationType: true,
                identificationNumber: true,
                isActive: true,
                isEmailVerified: true,
                isLegalRepresentative: true,
                createdAt: true,
                updatedAt: true
            },
            relations: { enterprise: true }
        });

        if (!user)
            throw new InvalidCredentialsException();

        this.cryptoService.validatePasswordSync(password, user.password);

        // Validar que el usuario pertenece al subdomain (delega al servicio de validación)
        this.authValidationService.validateUserBelongsToSubdomain(user, subdomain);

        // Generate token
        const token = this.generateTokenJwt({ id: user.id });

        // Return in the format expected by frontend (will be wrapped by ResponseInterceptor)
        // Frontend expects: { success: true, data: { token, user, enterprise }, statusCode: 200 }
        // We return the inner 'data' object, and the interceptor wraps it
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            token,
            userType: user.userType,
            // Include user and enterprise for frontend compatibility
            user: {
                id: user.id,
                enterpriseId: user.enterpriseId,
                userType: user.userType,
                name: user.name,
                phoneNumber: user.phoneNumber || '',
                lastName: user.lastName,
                email: user.email,
                addressId: user.addressId,
                identificationType: user.identificationType || '',
                identificationNumber: user.identificationNumber || '',
                isActive: user.isActive,
                isEmailVerified: user.isEmailVerified,
                isLegalRepresentative: user.isLegalRepresentative || false,
                createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
            } as any,
            enterprise: user.enterprise ? {
                id: user.enterprise.id,
                name: user.enterprise.name,
                subdomain: user.enterprise.subdomain,
                email: user.enterprise.email,
                phone: user.enterprise.phone,
                addressId: user.enterprise.addressId,
                taxIdType: user.enterprise.taxIdType,
                taxIdNumber: user.enterprise.taxIdNumber,
                logo: user.enterprise.logo,
                isActive: user.enterprise.isActive,
                createdAt: user.enterprise.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: user.enterprise.updatedAt?.toISOString() || new Date().toISOString(),
            } as any : undefined,
        } as any;
    }

    async googleLogin(_googleLoginDto: GoogleLoginDto): Promise<AuthResponseDto> {
        // Este endpoint es para empleados, usar /auth/google/client para clientes
        throw new BadRequestException('Use /auth/google/client para login de clientes con Google');
    }

    /**
     * Login/Register de clientes con Google OAuth
     * Si el usuario no existe, lo crea como CLIENT
     * Si ya existe, verifica que sea del mismo enterprise
     */
    async googleLoginClient(googleLoginDto: GoogleLoginDto, subdomain: string): Promise<AuthResponseDto> {
        try {
            // 1. Validar subdomain y obtener empresa
            this.authValidationService.validateSubdomain(subdomain);
            const enterprise = await this.authValidationService.validateAndGetEnterprise(subdomain);

            // 2. Verificar token de Google
            const googlePayload = await this.verifyGoogleToken(googleLoginDto.idToken);

            if (!googlePayload.email) {
                throw new BadRequestException('No se pudo obtener el email de Google');
            }

            // 3. Buscar usuario existente
            let user = await this.userRepositoy.findOne({
                where: {
                    email: googlePayload.email,
                    enterpriseId: enterprise.id,
                },
                select: { id: true, email: true, name: true, lastName: true, userType: true, enterpriseId: true },
            });

            // 4. Si no existe, crear nuevo usuario CLIENT
            if (!user) {
                const newUser = this.userRepositoy.create({
                    email: googlePayload.email,
                    name: googlePayload.given_name || googlePayload.name?.split(' ')[0] || 'Cliente',
                    lastName: googlePayload.family_name || googlePayload.name?.split(' ').slice(1).join(' ') || '',
                    phoneNumber: '',
                    password: await this.cryptoService.hashPassword(this.generateRandomPassword()),
                    userType: UserType.CLIENT,
                    enterpriseId: enterprise.id,
                    isEmailVerified: googlePayload.email_verified || false,
                    isActive: true,
                });
                user = await this.userRepositoy.save(newUser);
                this.logger.log(`New client registered via Google: ${user.email} for enterprise ${enterprise.subdomain}`);
            }

            // 5. Verificar que sea tipo CLIENT
            if (user.userType !== UserType.CLIENT) {
                throw new BadRequestException('Este email ya está registrado como empleado. Use el login normal.');
            }

            // 6. Retornar respuesta con token
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                lastName: user.lastName,
                userType: user.userType,
                token: this.generateTokenJwt({ id: user.id }),
                message: 'Login exitoso con Google',
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof InvalidCredentialsException) {
                throw error;
            }
            this.logger.error(`Google login error: ${error.message}`);
            throw new BadRequestException('Error al autenticar con Google');
        }
    }

    /**
     * Verifica el idToken de Google y retorna el payload
     */
    private async verifyGoogleToken(idToken: string) {
        try {
            this.logger.debug('🔍 Verifying Google token...');
            this.logger.debug(`📋 Token length: ${idToken?.length || 0}`);
            this.logger.debug(`🔑 Using CLIENT_ID: ${this.configService.get('GOOGLE_CLIENT_ID')}`);

            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: this.configService.get('GOOGLE_CLIENT_ID'),
            });

            const payload = ticket.getPayload();
            if (!payload) {
                this.logger.error('❌ Token verification returned no payload');
                throw new BadRequestException('Token de Google inválido');
            }

            this.logger.log(`✅ Google token verified successfully for: ${payload.email}`);
            return payload;
        } catch (error) {
            this.logger.error(`❌ Google token verification failed: ${error.message}`);
            this.logger.error(`📝 Error details: ${JSON.stringify(error)}`);
            throw new BadRequestException('Token de Google inválido o expirado');
        }
    }

    /**
     * Genera una contraseña aleatoria para usuarios de Google
     * (No la usarán, pero es requerida por el schema)
     */
    private generateRandomPassword(): string {
        return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    }

    async registerEnterprise(registerDto: RegisterEnterpriseDto): Promise<RegisterEnterpriseResponseDto> {
        // Validaciones antes de iniciar transacción
        this.authValidationService.validatePasswordConfirmation(registerDto.adminPassword, registerDto.adminConfirmPassword);
        await this.authValidationService.validateEnterpriseUniqueness(registerDto.subdomain, registerDto.enterpriseName);
        await this.authValidationService.validateEmailDoesNotExist(registerDto.adminEmail);

        // Transacción para crear empresa y admin
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Crear empresa
            const enterpriseData = this.mapEnterpriseData(registerDto);
            const enterprise = queryRunner.manager.create(Enterprise, {
                ...enterpriseData,
                isActive: true,
            });
            const savedEnterprise = await queryRunner.manager.save(Enterprise, enterprise);

            // 2. Crear usuario admin
            const hashedPassword = await this.cryptoService.hashPassword(registerDto.adminPassword);
            const adminData = this.mapAdminData(registerDto);
            const adminUser = queryRunner.manager.create(User, {
                ...adminData,
                password: hashedPassword,
                enterpriseId: savedEnterprise.id,
                userType: UserType.ENTERPRISE_ADMIN,
                isActive: true,
                isEmailVerified: false,
                isLegalRepresentative: true,
            });
            const savedUser = await queryRunner.manager.save(User, adminUser);

            // 3. Crear rol "Super Admin" con todos los permisos
            const superAdminRole = queryRunner.manager.create(Role, {
                name: 'Super Admin',
                description: 'Administrator with full access to all system features',
                enterpriseId: savedEnterprise.id,
                isActive: true,
            });
            const savedRole = await queryRunner.manager.save(Role, superAdminRole);

            // 4. Obtener TODOS los permisos del sistema
            const allPermissions = await this.permissionRepository.find();

            // 5. Asignar todos los permisos al rol Super Admin
            const rolePermissions = allPermissions.map(permission =>
                queryRunner.manager.create(RolePermission, {
                    role: savedRole,
                    permission,
                })
            );
            await queryRunner.manager.save(RolePermission, rolePermissions);

            // 6. Asignar el rol Super Admin al usuario admin
            const userRole = queryRunner.manager.create(UserRole, {
                userId: savedUser.id,
                roleId: savedRole.id,
                enterpriseId: savedEnterprise.id,
            });
            await queryRunner.manager.save(UserRole, userRole);

            // Commit solo si todo fue exitoso
            await queryRunner.commitTransaction();

            // Generar token de activación (5 minutos)
            const activationToken = this.generateActivationToken({
                userId: savedUser.id,
                type: 'ACTIVATION',
                subdomain: savedEnterprise.subdomain,
            });

            // Construir URL de redirección
            const appDomain = this.configService.get('APP_DOMAIN') || 'oceanix.space';
            const redirectUrl = `https://${savedEnterprise.subdomain}.${appDomain}/auth/activate?token=${activationToken}`;

            return {
                subdomain: savedEnterprise.subdomain,
                activationToken,
                message: 'Empresa registrada exitosamente. Redirigiendo a tu espacio de trabajo...',
                redirectUrl,
            };
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }



    private generateTokenJwt(payload: JwtPayload) {
        return this.jwtService.sign(payload);
    }

    /**
     * Genera un token JWT temporal de activación
     * Este token expira en 5 minutos y se usa para activar la cuenta desde el subdomain correcto
     */
    private generateActivationToken(payload: ActivationTokenPayload): string {
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_ACTIVATION_SECRET'),
            expiresIn: this.configService.get('JWT_ACTIVATION_EXPIRATION') || '5m',
        });
    }

    /**
     * Mapea los datos de empresa del DTO eliminando el prefijo "enterprise"
     */
    private mapEnterpriseData(registerDto: RegisterEnterpriseDto) {
        return {
            name: registerDto.enterpriseName,
            subdomain: registerDto.subdomain,
            email: registerDto.enterpriseEmail,
            phone: registerDto.enterprisePhone,
            addressId: registerDto.enterpriseAddressId,
            taxIdType: registerDto.enterpriseTaxIdType,
            taxIdNumber: registerDto.enterpriseTaxIdNumber,
        };
    }

    /**
     * Mapea los datos del usuario admin del DTO eliminando el prefijo "admin"
     */
    private mapAdminData(registerDto: RegisterEnterpriseDto) {
        return {
            name: registerDto.adminName,
            lastName: registerDto.adminLastName,
            email: registerDto.adminEmail,
            phoneNumber: registerDto.adminPhoneNumber,
            addressId: registerDto.adminAddressId,
            identificationType: registerDto.adminIdentificationType,
            identificationNumber: registerDto.adminIdentificationNumber,
        };
    }

    /**
     * Get complete user profile with permissions, roles, enterprise, and config
     * Used by /auth/me endpoint to provide all configuration data to frontend
     */
    async getUserProfile(user: User): Promise<UserProfileResponseDto> {
        // 1. Get enterprise configuration
        const enterpriseConfig = await this.enterpriseConfigService.getByEnterpriseId(user.enterpriseId);

        // 2. Aggregate unique permissions from all roles
        const permissionsSet = new Set<string>();
        if (user.roles && user.roles.length > 0) {
            user.roles.forEach(userRole => {
                if (userRole.role?.permissions) {
                    userRole.role.permissions.forEach(rolePermission => {
                        if (rolePermission.permission?.name) {
                            permissionsSet.add(rolePermission.permission.name);
                        }
                    });
                }
            });
        }

        // 3. Format roles
        const roles = user.roles?.map(userRole => ({
            id: userRole.role.id,
            name: userRole.role.name,
            description: userRole.role.description,
        })) || [];

        // 4. Generate default logo/favicon/banner if not set
        const logoUrl = enterpriseConfig.logoUrl || this.generateDefaultLogo(user.enterprise.name);
        const faviconUrl = enterpriseConfig.faviconUrl || this.generateDefaultFavicon(user.enterprise.name);
        const bannerUrl = enterpriseConfig.bannerUrl || this.generateDefaultBanner(user.enterprise.name);

        // 5. Build response
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                userType: user.userType,
                isEmailVerified: user.isEmailVerified ?? false,
                isActive: user.isActive ?? false,
            },
            enterprise: {
                id: user.enterprise.id,
                name: user.enterprise.name,
                subdomain: user.enterprise.subdomain,
                email: user.enterprise.email,
                phone: user.enterprise.phone,
            },
            config: {
                isVerified: enterpriseConfig.isVerified,
                verificationStatus: enterpriseConfig.verificationStatus,
                primaryColor: enterpriseConfig.primaryColor,
                secondaryColor: enterpriseConfig.secondaryColor,
                accentColor: enterpriseConfig.accentColor,
                logoUrl,
                faviconUrl,
                bannerUrl,
                requireCorporateEmail: enterpriseConfig.requireCorporateEmail,
            },
            roles,
            permissions: Array.from(permissionsSet),
        };
    }

    /**
     * Generate default logo URL using Lorem Picsum
     * Uses enterprise name as seed to ensure consistent image
     * @param name Enterprise name (used as seed for consistency)
     * @returns URL to generated logo from Lorem Picsum
     */
    private generateDefaultLogo(name: string): string {
        const seed = encodeURIComponent(name);
        return `https://picsum.photos/seed/${seed}/200/200`;
    }

    /**
     * Generate default favicon URL using Lorem Picsum
     * Uses enterprise name as seed to ensure consistent image across reloads
     * @param name Enterprise name (used as seed for consistency)
     * @returns URL to generated favicon from Lorem Picsum
     */
    private generateDefaultFavicon(name: string): string {
        const seed = encodeURIComponent(name + '-favicon');
        return `https://picsum.photos/seed/${seed}/64/64`;
    }

    /**
     * Generate default banner URL using Lorem Picsum
     * Uses enterprise name as seed to ensure consistent image
     * @param name Enterprise name (used as seed for consistency)
     * @returns URL to generated banner from Lorem Picsum
     */
    private generateDefaultBanner(name: string): string {
        const seed = encodeURIComponent(name + '-banner');
        return `https://picsum.photos/seed/${seed}/1200/400`;
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
