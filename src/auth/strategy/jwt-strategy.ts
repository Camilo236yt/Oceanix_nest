import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { JwtPayload, EnrichedJwtUser } from "../interfaces/jwt-payload.interface";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Request } from 'express';

@Injectable()
export class jwtStrategy extends PassportStrategy(Strategy) {

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
                    return request?.cookies?.authToken;
                },
                // Si no hay cookie, intenta desde Authorization header (compatibilidad)
                ExtractJwt.fromAuthHeaderAsBearerToken()
            ])
        })
    }
    

    async validate(payload: JwtPayload): Promise<EnrichedJwtUser> {
        const { id } = payload;

        const user = await this.userRepositoy.findOne({
            where: { id },
            relations: ['roles', 'roles.role', 'roles.role.permissions', 'roles.role.permissions.permission', 'enterprise']
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('user not active, verify your email or contact with the admin');
        }

        // If user is not SUPER_ADMIN, check enterprise is active
        if (user.enterpriseId && !user.enterprise?.isActive) {
            throw new UnauthorizedException('Enterprise is inactive');
        }

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