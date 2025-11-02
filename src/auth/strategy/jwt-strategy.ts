import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
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
            secretOrKey: configService.get('JWT_SECRET'),
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
    

    async validate(payload:JwtPayload): Promise<User> {

        const { id } = payload;

        const user = await this.userRepositoy.findOne({
            where: { id },
            relations: {
                roles: {
                    role: {
                        permissions: {
                            permission: {
                                parent: true,
                                children: true
                            }
                        }
                    }
                }
            }
        });
        
        if(!user){
            throw new NotFoundException('Usuario no encontrado')
        }

        if(!user.isActive)
            throw new UnauthorizedException('user not active, verify your email or contact with the admin')


        return user;
    }

}