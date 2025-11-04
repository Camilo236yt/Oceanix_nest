import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CryptoService } from '../auth/services/crypto.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { USER_MESSAGES } from './constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly cryptoService: CryptoService,
  ) {}

  async create(createUserDto: CreateUserDto, enterpriseId?: string): Promise<User> {
    const { roleIds, ...userDto } = createUserDto;

    if (userDto.password !== userDto.confirmPassword) {
      throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
    }

    // Validate userType consistency
    if (userDto.userType === 'SUPER_ADMIN' && enterpriseId) {
      throw new BadRequestException(USER_MESSAGES.SUPER_ADMIN_CANNOT_HAVE_ENTERPRISE);
    }

    if (userDto.userType && userDto.userType !== 'SUPER_ADMIN' && !enterpriseId) {
      throw new BadRequestException(USER_MESSAGES.NON_SUPER_ADMIN_MUST_HAVE_ENTERPRISE);
    }

    const existingUser = await this.userRepository.findOne({
      where: {
        email: userDto.email,
        enterpriseId: enterpriseId ? enterpriseId : IsNull(),
      }
    });
    if (existingUser) {
      throw new BadRequestException(USER_MESSAGES.EMAIL_ALREADY_REGISTERED);
    }

    // If roleIds provided, validate they exist and belong to the enterprise
    if (roleIds && roleIds.length > 0) {
      await this.validateRolesBelongToEnterprise(roleIds, enterpriseId);
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const hashedPassword = await this.cryptoService.hashPassword(userDto.password);

      const user = queryRunner.manager.create(User, {
        name: userDto.name,
        lastName: userDto.lastName,
        phoneNumber: userDto.phoneNumber,
        email: userDto.email,
        password: hashedPassword,
        userType: userDto.userType,
        addressId: userDto.addressId,
        identificationType: userDto.identificationType,
        identificationNumber: userDto.identificationNumber,
        isActive: userDto.isActive ?? true,
        isEmailVerified: true,
        isLegalRepresentative: userDto.isLegalRepresentative ?? false,
        enterpriseId
      });

      const savedUser = await queryRunner.manager.save(User, user);

      // Assign roles if provided (bulk insert)
      if (roleIds && roleIds.length > 0 && enterpriseId) {
        const userRoles = roleIds.map(roleId =>
          queryRunner.manager.create(UserRole, {
            userId: savedUser.id,
            roleId: roleId,
            enterpriseId: enterpriseId,
          })
        );
        await queryRunner.manager.save(UserRole, userRoles);
      }

      await queryRunner.commitTransaction();

      // Load user with roles
      const userWithRoles = await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ['roles', 'roles.role'],
      });

      if (!userWithRoles) {
        throw new NotFoundException('User was created but could not be retrieved');
      }

      return userWithRoles;

    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(paginationDto: PaginationDto, enterpriseId?: string) {
    const { page = 1, limit = 10 } = paginationDto;

    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        isActive: true,
        ...(enterpriseId && { enterpriseId }),
      },
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, validateActive = true): Promise<User> {
    const where: any = { id };

    if (validateActive) {
      where.isActive = true;
    }

    const user = await this.userRepository.findOne({
      where
    });

    if (!user) {
      throw new NotFoundException(USER_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { password, confirmPassword, ...restOfFields } = updateUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { id }
    });
    if (!existingUser) {
      throw new NotFoundException(USER_MESSAGES.USER_NOT_FOUND);
    }

    if ((password && !confirmPassword) || (!password && confirmPassword)) {
      throw new BadRequestException(
        'Debe enviar ambas contraseñas para actualizar la contraseña',
      );
    }

    if (password && confirmPassword && password !== confirmPassword) {
      throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
    }

    const updateData: Partial<User> = { ...restOfFields };

    if (password && confirmPassword) {
      updateData.password = await this.cryptoService.hashPassword(password);
    }

    await this.userRepository.update(id, updateData);

    const updatedUser = await this.userRepository.findOne({
      where: { id }
    });

    return updatedUser || existingUser;
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    user.isActive = false;
    await this.userRepository.save(user);

    return { message: USER_MESSAGES.USER_DEACTIVATED };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto;

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
    }

    const user = await this.findOne(userId);

    const isCurrentPasswordValid = await this.cryptoService.comparePasswords(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException(USER_MESSAGES.INVALID_CURRENT_PASSWORD);
    }

    const hashedNewPassword = await this.cryptoService.hashPassword(newPassword);
    await this.userRepository.update(userId, { password: hashedNewPassword });
  }

  // Role management methods
  private async validateRolesBelongToEnterprise(roleIds: string[], enterpriseId?: string): Promise<void> {
    if (!enterpriseId) {
      throw new BadRequestException('Cannot assign roles without an enterprise context');
    }

    const roles = await this.roleRepository.find({
      where: roleIds.map(roleId => ({ id: roleId })),
    });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    // Validate all roles belong to the same enterprise
    const invalidRoles = roles.filter(role => role.enterpriseId !== enterpriseId);
    if (invalidRoles.length > 0) {
      throw new ForbiddenException('Cannot assign roles from other enterprises');
    }
  }

  async assignRolesToUser(userId: string, roleIds: string[], enterpriseId: string): Promise<void> {
    const user = await this.findOne(userId);

    if (user.enterpriseId !== enterpriseId) {
      throw new ForbiddenException('Cannot assign roles to users from other enterprises');
    }

    // Validate roles belong to the enterprise
    await this.validateRolesBelongToEnterprise(roleIds, enterpriseId);

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check which roles are already assigned
      const existingUserRoles = await queryRunner.manager.find(UserRole, {
        where: { userId, enterpriseId },
      });
      const existingRoleIds = existingUserRoles.map(ur => ur.roleId);

      // Filter out roles that are already assigned
      const newRoleIds = roleIds.filter(roleId => !existingRoleIds.includes(roleId));

      // Bulk insert new roles
      if (newRoleIds.length > 0) {
        const userRoles = newRoleIds.map(roleId =>
          queryRunner.manager.create(UserRole, {
            userId,
            roleId,
            enterpriseId,
          })
        );
        await queryRunner.manager.save(UserRole, userRoles);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeRoleFromUser(userId: string, roleId: string, enterpriseId: string): Promise<void> {
    const user = await this.findOne(userId);

    if (user.enterpriseId !== enterpriseId) {
      throw new ForbiddenException('Cannot remove roles from users of other enterprises');
    }

    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId, enterpriseId },
    });

    if (!userRole) {
      throw new NotFoundException('User does not have this role assigned');
    }

    await this.userRoleRepository.remove(userRole);
  }

  async getUserRoles(userId: string, enterpriseId?: string): Promise<UserRole[]> {
    const user = await this.findOne(userId);

    if (enterpriseId && user.enterpriseId !== enterpriseId) {
      throw new ForbiddenException('Cannot access roles of users from other enterprises');
    }

    return await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });
  }
}
