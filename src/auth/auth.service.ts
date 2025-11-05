import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import {
  RegisterDto,
  RegisterEnterpriseDto,
  LoginDto,
  GoogleLoginDto,
  LoginResponseDto,
  RegisterResponseDto
} from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserType } from 'src/users/entities/user.entity';
import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { CryptoService } from './services/crypto.service';
import {
  InvalidCredentialsException,
  EmailAlreadyExistsException,
  AuthDatabaseException
} from './exceptions/index';
import { USER_MESSAGES } from '../users/constants';
import { ENTERPRISE_MESSAGES } from '../enterprise/constants';
import { LocationService } from 'src/location/location.service';


@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private readonly userRepositoy:Repository<User>,
        @InjectRepository(Enterprise)
        private readonly enterpriseRepository: Repository<Enterprise>,
        private readonly dataSource: DataSource,
        private readonly jwtService: JwtService,
        private readonly cryptoService: CryptoService,
        private readonly locationService: LocationService
    ){}
    
    async register( registerDto:RegisterDto, subdomain: string ): Promise<RegisterResponseDto> {
        const {email, password, confirmPassword, address, ...registerDetail} = registerDto;

        try {
            // Validate password confirmation
            if (password !== confirmPassword) {
                throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
            }

            // Validate subdomain is provided
            if (!subdomain) {
                throw new BadRequestException('Subdomain is required');
            }

            // Find the enterprise by subdomain
            const enterprise = await this.enterpriseRepository.findOne({
                where: { subdomain, isActive: true },
            });

            if (!enterprise) {
                throw new BadRequestException('Enterprise not found or inactive');
            }

            // Check if user email already exists in this enterprise
            const existingUser = await this.userRepositoy.findOne({
                where: { email, enterpriseId: enterprise.id }
            });

            if (existingUser) {
                throw new EmailAlreadyExistsException(email);
            }

            // Remove address and confirmPassword from the DTO
            const { address: _, confirmPassword: __, ...userDataWithoutAddress } = registerDto;

            const hashedPassword = await this.cryptoService.hashPassword(password);

            // This endpoint creates CLIENT users for enterprises
            const newUser = this.userRepositoy.create({
                ...userDataWithoutAddress,
                password: hashedPassword,
                userType: UserType.CLIENT,
                enterpriseId: enterprise.id,
                isEmailVerified: false, // Clients need to verify email
                isActive: true
                // addressId is optional, so we don't need to set it
            });
            const savedUser = await this.userRepositoy.save(newUser);

            const { password: _pass, ...userWithoutPassword } = savedUser;

            return {
                ...userWithoutPassword,
                token: this.generateTokenJwt({id: savedUser.id}),
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

    async registerEnterprise(registerDto: RegisterEnterpriseDto) {
        // Validate passwords match
        if (registerDto.adminPassword !== registerDto.adminConfirmPassword) {
            throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
        }

        // Check if subdomain already exists
        const existingBySubdomain = await this.enterpriseRepository.findOne({
            where: { subdomain: registerDto.subdomain },
        });
        if (existingBySubdomain) {
            throw new BadRequestException(ENTERPRISE_MESSAGES.SUBDOMAIN_ALREADY_EXISTS);
        }

        // Check if enterprise name already exists
        const existingByName = await this.enterpriseRepository.findOne({
            where: { name: registerDto.enterpriseName },
        });
        if (existingByName) {
            throw new BadRequestException(ENTERPRISE_MESSAGES.NAME_ALREADY_EXISTS);
        }

        // Check if admin email already exists
        const existingUser = await this.userRepositoy.findOne({
            where: { email: registerDto.adminEmail },
        });
        if (existingUser) {
            throw new EmailAlreadyExistsException(registerDto.adminEmail);
        }

        // Use transaction to ensure atomicity
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Create enterprise
            const enterprise = queryRunner.manager.create(Enterprise, {
                name: registerDto.enterpriseName,
                subdomain: registerDto.subdomain,
                email: registerDto.enterpriseEmail,
                phone: registerDto.enterprisePhone,
                addressId: registerDto.enterpriseAddressId,
                taxIdType: registerDto.enterpriseTaxIdType,
                taxIdNumber: registerDto.enterpriseTaxIdNumber,
                isActive: true,
            });
            const savedEnterprise = await queryRunner.manager.save(Enterprise, enterprise);

            // 2. Create admin user
            const hashedPassword = await this.cryptoService.hashPassword(registerDto.adminPassword);
            const adminUser = queryRunner.manager.create(User, {
                name: registerDto.adminName,
                lastName: registerDto.adminLastName,
                email: registerDto.adminEmail,
                phoneNumber: registerDto.adminPhoneNumber,
                password: hashedPassword,
                addressId: registerDto.adminAddressId,
                identificationType: registerDto.adminIdentificationType,
                identificationNumber: registerDto.adminIdentificationNumber,
                enterpriseId: savedEnterprise.id,
                userType: UserType.ENTERPRISE_ADMIN,
                isActive: true,
                isEmailVerified: false,
                isLegalRepresentative: true, // El que registra la empresa es el representante legal
            });
            const savedUser = await queryRunner.manager.save(User, adminUser);

            // Prepare response BEFORE committing
            const { password, ...userWithoutPassword } = savedUser;
            const token = this.generateTokenJwt({ id: savedUser.id });

            // Only commit if everything succeeded
            await queryRunner.commitTransaction();

            // Return response after successful commit
            return {
                enterprise: savedEnterprise,
                admin: userWithoutPassword,
                token,
                message: 'Empresa registrada exitosamente. Por favor verifica tu email.',
            };
        } catch (error) {
            // Only rollback if transaction is active
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
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
