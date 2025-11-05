import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import { EmailAlreadyExistsException } from '../exceptions';
import { USER_MESSAGES } from 'src/users/constants';
import { ENTERPRISE_MESSAGES } from 'src/enterprise/constants';

/**
 * Servicio dedicado a validaciones de autenticación
 *
 * Separa la lógica de validación del AuthService principal
 * para mejorar la testabilidad y mantenibilidad
 */
@Injectable()
export class AuthValidationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enterprise)
    private readonly enterpriseRepository: Repository<Enterprise>,
  ) {}

  /**
   * Valida que las contraseñas coincidan
   */
  validatePasswordConfirmation(password: string, confirmPassword: string): void {
    if (password !== confirmPassword) {
      throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
    }
  }

  /**
   * Valida que el subdomain esté presente
   */
  validateSubdomain(subdomain: string): void {
    if (!subdomain) {
      throw new BadRequestException('Subdomain is required');
    }
  }

  /**
   * Valida que la empresa exista y esté activa, y la retorna
   */
  async validateAndGetEnterprise(subdomain: string): Promise<Enterprise> {
    const enterprise = await this.enterpriseRepository.findOne({
      where: { subdomain, isActive: true },
    });

    if (!enterprise) {
      throw new BadRequestException('Enterprise not found or inactive');
    }

    return enterprise;
  }

  /**
   * Valida que el usuario NO exista en una empresa específica
   */
  async validateUserDoesNotExist(email: string, enterpriseId: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email, enterpriseId },
    });

    if (existingUser) {
      throw new EmailAlreadyExistsException(email);
    }
  }

  /**
   * Valida que el email NO exista en ninguna empresa
   * (usado para admins que no están asociados a una empresa específica)
   */
  async validateEmailDoesNotExist(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new EmailAlreadyExistsException(email);
    }
  }

  /**
   * Valida que el subdomain y nombre de empresa sean únicos
   */
  async validateEnterpriseUniqueness(subdomain: string, name: string): Promise<void> {
    // Validar subdomain único
    const existingBySubdomain = await this.enterpriseRepository.findOne({
      where: { subdomain },
    });
    if (existingBySubdomain) {
      throw new BadRequestException(ENTERPRISE_MESSAGES.SUBDOMAIN_ALREADY_EXISTS);
    }

    // Validar nombre único
    const existingByName = await this.enterpriseRepository.findOne({
      where: { name },
    });
    if (existingByName) {
      throw new BadRequestException(ENTERPRISE_MESSAGES.NAME_ALREADY_EXISTS);
    }
  }
}
