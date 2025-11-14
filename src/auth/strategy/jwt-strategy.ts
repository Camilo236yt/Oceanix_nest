import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { JwtPayload, EnrichedJwtUser } from "../interfaces/jwt-payload.interface";
import { Injectable, NotFoundException, UnauthorizedException, Logger } from "@nestjs/common";
import { Request } from 'express';

@Injectable()
export class jwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(jwtStrategy.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepositoy:Repository<User>,
        configService:ConfigService
    ){
        super({
            secretOrKey: configService.get('JWT_SECRET')!,
            jwtFromRequest: ExtractJwt.fromExtractors([
                // Primero intenta extraer desde cookies
                (request: Request) => {
                    const token = request?.cookies?.authToken;
                    if (token) {
                        console.log('🔐 JWT Token extracted from cookie');
                    }
                    return token;
                },
                // Si no hay cookie, intenta desde Authorization header (compatibilidad)
                ExtractJwt.fromAuthHeaderAsBearerToken()
            ])
        })
    }


    async validate(payload: JwtPayload): Promise<EnrichedJwtUser> {
        this.logger.log(`🔍 Validating JWT for user ID: ${payload.id}`);
        const { id } = payload;

        const user = await this.userRepositoy.findOne({
            where: { id },
            relations: ['roles', 'roles.role', 'roles.role.permissions', 'roles.role.permissions.permission', 'enterprise']
        });

        if (!user) {
            this.logger.error(`❌ User not found with ID: ${id}`);
            throw new NotFoundException('Usuario no encontrado');
        }

        this.logger.log(`✅ User found: ${user.email} (Enterprise: ${user.enterpriseId || 'N/A'})`);

        if (!user.isActive) {
            this.logger.warn(`⚠️  User ${user.email} is not active`);
            throw new UnauthorizedException('user not active, verify your email or contact with the admin');
        }

        // If user is not SUPER_ADMIN, check enterprise is active
        if (user.enterpriseId && !user.enterprise?.isActive) {
            this.logger.warn(`⚠️  Enterprise is inactive for user ${user.email}`);
            throw new UnauthorizedException('Enterprise is inactive');
        }

        // Log roles and permissions
        const rolesCount = user.roles?.length || 0;
        const totalPermissions = user.roles?.reduce((acc, ur) => acc + (ur.role.permissions?.length || 0), 0) || 0;
        this.logger.log(`👤 User ${user.email}: ${rolesCount} roles, ${totalPermissions} total permissions`);

        // Return enriched user object with multi-tenant context
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            enterpriseId: user.enterpriseId,
            userType: user.userType,
            roles: user.roles?.map(ur => ({
                id: ur.role.id,
                name: ur.role.name,
                permissions: ur.role.permissions?.map(rp => rp.permission.name) || []
            })) || [],
            isActive: user.isActive ?? false,
            isEmailVerified: user.isEmailVerified ?? false,
        };
    }

}