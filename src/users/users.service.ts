import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource, FindOptionsWhere } from 'typeorm';
import { paginate, Paginated, FilterOperator } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CryptoService } from '../auth/services/crypto.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { USER_MESSAGES } from './constants';
import { NotificationService } from '../notification/notification.service';
import { NotificationType, NotificationPriority } from '../notification/enums';
import { Permission } from '../permissions/entities/permission.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { createPaginationConfig } from '../common/helpers/pagination.config';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly cryptoService: CryptoService,
    private readonly notificationService: NotificationService,
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
        throw new NotFoundException(USER_MESSAGES.USER_CREATED_BUT_NOT_RETRIEVED);
      }

      // Enviar notificaciones a usuarios con permisos de gestión de usuarios
      // Solo si es un usuario de empresa (no SUPER_ADMIN)
      if (enterpriseId) {
        this.sendUserCreationNotifications(userWithRoles, enterpriseId).catch(error => {
          // No bloquear la respuesta si falla la notificación
          this.logger.error(`Failed to send user creation notifications:`, error);
        });
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

  /**
   * Lista usuarios con paginación, filtros y búsqueda
   */
  async findAllPaginated(
    query: PaginateQuery,
    enterpriseId?: string,
  ): Promise<Paginated<User>> {
    const config = createPaginationConfig<User>({
      sortableColumns: ['createdAt', 'name', 'lastName', 'email', 'userType'],
      searchableColumns: ['name', 'lastName', 'email'],
      filterableColumns: {
        userType: [FilterOperator.EQ, FilterOperator.IN],
        isActive: [FilterOperator.EQ],
        createdAt: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
      },
      defaultSortBy: [['name', 'ASC']],
      where: {
        isActive: true,
        ...(enterpriseId && { enterpriseId }),
      },
    });

    return paginate(query, this.userRepository, config);
  }

  async findOne(id: string, validateActive = true, enterpriseId?: string): Promise<User> {
    const where: FindOptionsWhere<User> = { id };

    if (validateActive) {
      where.isActive = true;
    }

    // Add enterprise isolation (SUPER_ADMIN bypass by not passing enterpriseId)
    if (enterpriseId) {
      where.enterpriseId = enterpriseId;
    }

    const user = await this.userRepository.findOne({
      where
    });

    if (!user) {
      throw new NotFoundException(USER_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, enterpriseId?: string): Promise<User> {
    const { password, confirmPassword, ...restOfFields } = updateUserDto;

    // Use findOne with enterprise isolation
    const existingUser = await this.findOne(id, true, enterpriseId);

    if ((password && !confirmPassword) || (!password && confirmPassword)) {
      throw new BadRequestException(USER_MESSAGES.PASSWORD_BOTH_REQUIRED);
    }

    if (password && confirmPassword && password !== confirmPassword) {
      throw new BadRequestException(USER_MESSAGES.PASSWORD_MISMATCH);
    }

    const updateData: Partial<User> = { ...restOfFields };

    if (password && confirmPassword) {
      updateData.password = await this.cryptoService.hashPassword(password);
    }

    await this.userRepository.update(id, updateData);

    const updatedUser = await this.findOne(id, true, enterpriseId);

    return updatedUser;
  }

  async remove(id: string, enterpriseId?: string): Promise<{ message: string }> {
    // Use findOne with enterprise isolation
    const user = await this.findOne(id, true, enterpriseId);

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
  /**
   * Validates that all provided roles belong to the specified enterprise and are active.
   * @param roleIds - Array of role UUIDs to validate
   * @param enterpriseId - The enterprise ID to check ownership against
   * @throws {BadRequestException} If no enterpriseId is provided
   * @throws {NotFoundException} If any role is not found or inactive
   * @throws {ForbiddenException} If any role doesn't belong to the enterprise
   */
  private async validateRolesBelongToEnterprise(roleIds: string[], enterpriseId?: string): Promise<void> {
    if (!enterpriseId) {
      throw new BadRequestException(USER_MESSAGES.CANNOT_ASSIGN_ROLES_WITHOUT_ENTERPRISE);
    }

    const roles = await this.roleRepository.find({
      where: roleIds.map(roleId => ({ id: roleId, isActive: true })),
    });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException(USER_MESSAGES.ROLES_NOT_FOUND_OR_INACTIVE);
    }

    // Validate all roles belong to the same enterprise and are active
    const invalidRoles = roles.filter(role =>
      role.enterpriseId !== enterpriseId || !role.isActive
    );

    if (invalidRoles.length > 0) {
      throw new ForbiddenException(USER_MESSAGES.CANNOT_ASSIGN_ROLES_FROM_OTHER_ENTERPRISES);
    }
  }

  /**
   * Assigns multiple roles to a user within the same enterprise context.
   * Only assigns roles that aren't already assigned to avoid duplicates.
   * Uses a transaction to ensure atomicity.
   * @param userId - UUID of the user to assign roles to
   * @param roleIds - Array of role UUIDs to assign
   * @param enterpriseId - The enterprise ID for tenant isolation
   * @throws {NotFoundException} If user is not found
   * @throws {ForbiddenException} If user doesn't belong to the enterprise
   * @throws {BadRequestException} If roles don't belong to the enterprise
   */
  async assignRolesToUser(userId: string, roleIds: string[], enterpriseId: string): Promise<void> {
    const user = await this.findOne(userId);

    if (user.enterpriseId !== enterpriseId) {
      throw new ForbiddenException(USER_MESSAGES.CANNOT_ASSIGN_ROLES_TO_OTHER_ENTERPRISE_USERS);
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

  /**
   * Removes a specific role from a user within the same enterprise context.
   * @param userId - UUID of the user to remove the role from
   * @param roleId - UUID of the role to remove
   * @param enterpriseId - The enterprise ID for tenant isolation
   * @throws {NotFoundException} If user or user-role assignment is not found
   * @throws {ForbiddenException} If user doesn't belong to the enterprise
   */
  async removeRoleFromUser(userId: string, roleId: string, enterpriseId: string): Promise<void> {
    const user = await this.findOne(userId);

    if (user.enterpriseId !== enterpriseId) {
      throw new ForbiddenException(USER_MESSAGES.CANNOT_REMOVE_ROLES_FROM_OTHER_ENTERPRISE_USERS);
    }

    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId, enterpriseId },
    });

    if (!userRole) {
      throw new NotFoundException(USER_MESSAGES.USER_DOES_NOT_HAVE_ROLE);
    }

    await this.userRoleRepository.remove(userRole);
  }

  /**
   * Retrieves all roles assigned to a user with enterprise isolation.
   * @param userId - UUID of the user to get roles for
   * @param enterpriseId - Optional enterprise ID for tenant isolation
   * @returns Array of UserRole entities with role relations loaded
   * @throws {NotFoundException} If user is not found
   * @throws {ForbiddenException} If trying to access roles from a different enterprise
   */
  async getUserRoles(userId: string, enterpriseId?: string): Promise<UserRole[]> {
    const user = await this.findOne(userId);

    if (enterpriseId && user.enterpriseId !== enterpriseId) {
      throw new ForbiddenException(USER_MESSAGES.CANNOT_ACCESS_ROLES_FROM_OTHER_ENTERPRISES);
    }

    return await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });
  }

  /**
   * Obtiene todos los usuarios de una empresa que tienen un permiso específico
   * @param permissionName - Nombre del permiso a buscar (ej: 'create_users')
   * @param enterpriseId - ID de la empresa para aislar los usuarios
   * @returns Array de IDs de usuarios que tienen el permiso
   */
  private async getUsersWithPermission(
    permissionName: string,
    enterpriseId: string,
  ): Promise<string[]> {
    try {
      // Query compleja para obtener usuarios que tienen un permiso específico
      // User -> UserRole -> Role -> RolePermission -> Permission
      const usersWithPermission = await this.dataSource
        .createQueryBuilder(User, 'user')
        .innerJoin('user.roles', 'userRole')
        .innerJoin('userRole.role', 'role')
        .innerJoin('role.permissions', 'rolePermission')
        .innerJoin('rolePermission.permission', 'permission')
        .where('user.enterpriseId = :enterpriseId', { enterpriseId })
        .andWhere('user.isActive = :isActive', { isActive: true })
        .andWhere('permission.name = :permissionName', { permissionName })
        .andWhere('permission.isActive = :permissionActive', { permissionActive: true })
        .select(['user.id'])
        .distinct(true)
        .getMany();

      return usersWithPermission.map(user => user.id);
    } catch (error) {
      this.logger.error(
        `Error getting users with permission ${permissionName} for enterprise ${enterpriseId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Envía notificaciones a usuarios con permisos de gestión cuando se crea un nuevo usuario
   * @param createdUser - El usuario que fue creado
   * @param enterpriseId - ID de la empresa
   */
  private async sendUserCreationNotifications(
    createdUser: User,
    enterpriseId: string,
  ): Promise<void> {
    try {
      // Obtener usuarios con permisos de crear usuarios
      const usersWithCreatePermission = await this.getUsersWithPermission('create_users', enterpriseId);

      // Obtener usuarios con permisos de gestionar usuarios (incluye create_users implícitamente)
      const usersWithManagePermission = await this.getUsersWithPermission('manage_users', enterpriseId);

      // Combinar y eliminar duplicados
      const uniqueUserIds = [...new Set([...usersWithCreatePermission, ...usersWithManagePermission])];

      // Excluir al usuario recién creado de las notificaciones
      const usersToNotify = uniqueUserIds.filter(userId => userId !== createdUser.id);

      if (usersToNotify.length === 0) {
        this.logger.debug('No users with manage_users permission to notify');
        return;
      }

      this.logger.log(`Sending user creation notifications to ${usersToNotify.length} users`);

      // Enviar notificación a cada usuario con los permisos
      const notificationPromises = usersToNotify.map(userId =>
        this.notificationService.sendToUser(
          userId,
          enterpriseId,
          {
            title: 'Nuevo usuario creado',
            message: `Se ha creado un nuevo usuario: ${createdUser.name} ${createdUser.lastName} (${createdUser.email})`,
            type: NotificationType.USER_CREATED,
            priority: NotificationPriority.NORMAL,
            metadata: {
              userId: createdUser.id,
              userEmail: createdUser.email,
              userName: `${createdUser.name} ${createdUser.lastName}`,
              userType: createdUser.userType,
            },
          },
        ),
      );

      await Promise.allSettled(notificationPromises);
      this.logger.log('User creation notifications sent successfully');
    } catch (error) {
      this.logger.error('Error sending user creation notifications:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }
}
