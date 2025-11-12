import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

import { User, UserType } from 'src/users/entities/user.entity';
import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import { RegisterDto, RegisterEnterpriseDto, LoginDto, GoogleLoginDto } from './dto';
import { JwtPayload, AuthResponseDto } from './interfaces';
import { CryptoService, AuthValidationService } from './services';
import { InvalidCredentialsException, EmailAlreadyExistsException, AuthDatabaseException } from './exceptions';


@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepositoy: Repository<User>,
        private readonly dataSource: DataSource,
        private readonly jwtService: JwtService,
        private readonly cryptoService: CryptoService,
        private readonly authValidationService: AuthValidationService,
    ) { }

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


    async login(loginDto: LoginDto, subdomain?: string): Promise<AuthResponseDto> {
        const { email, password } = loginDto;

        const user = await this.userRepositoy.findOne({
            where: { email },
            select: { id: true, password: true, email: true, name: true, lastName: true, userType: true, enterpriseId: true },
            relations: { enterprise: true }
        });

        if (!user)
            throw new InvalidCredentialsException();

        this.cryptoService.validatePasswordSync(password, user.password);

        // Validar que el usuario pertenece al subdomain (delega al servicio de validación)
        this.authValidationService.validateUserBelongsToSubdomain(user, subdomain);

        const { password: _, ...userWithoutPassword } = user;

        return {
            ...userWithoutPassword,
            token: this.generateTokenJwt({ id: user.id })
        };
    }

    async googleLogin(googleLoginDto: GoogleLoginDto): Promise<AuthResponseDto> {
        // TODO: Implementar login con Google
        throw new InternalServerErrorException('Google login not implemented yet');
    }

    async registerEnterprise(registerDto: RegisterEnterpriseDto) {
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

            // Commit solo si todo fue exitoso
            await queryRunner.commitTransaction();

            // Preparar respuesta DESPUÉS del commit exitoso
            const { password, ...userWithoutPassword } = savedUser;
            const token = this.generateTokenJwt({ id: savedUser.id });

            return {
                enterprise: savedEnterprise,
                admin: userWithoutPassword,
                token,
                message: 'Empresa registrada exitosamente. Por favor verifica tu email.',
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
