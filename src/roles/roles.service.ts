import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { BaseFilterService } from 'src/common/services';
import { FilterType } from 'src/common/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RolesService extends BaseFilterService<Role> {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(rolesRepository, 'role');
  }

  // Implementar métodos requeridos por BaseFilterService
  getSearchableFields(): string[] {
    return ['name', 'description'];
  }

  getSortableFields(): string[] {
    return ['id', 'name', 'createdAt'];
  }

  getFilterableFields(): Record<string, FilterType> {
    return {
      'isActive': FilterType.BOOLEAN,
      'createdAfter': FilterType.GREATER_THAN_OR_EQUAL,
      'createdBefore': FilterType.LESS_THAN_OR_EQUAL,
    };
  }

  // Método para obtener campo de fecha
  getDateField(): string | null {
    return 'createdAt';
  }

  // Método para cargar relaciones
  getRelations(): string[] {
    return ['permissions'];
  }

  // Sobrescribir findWithFilters para cargar relaciones anidadas manualmente
  async findWithFilters(params: any) {
    const result = await super.findWithFilters(params);

    // Cargar manualmente las relaciones de permisos para cada rol
    if (result.data && result.data.length > 0) {
      const roleIds = result.data.map((role: any) => role.id);
      const rolesWithPermissions = await this.rolesRepository
        .createQueryBuilder('role')
        .leftJoinAndSelect('role.permissions', 'rolePermission')
        .leftJoinAndSelect('rolePermission.permission', 'permission')
        .whereInIds(roleIds)
        .getMany();

      // Reemplazar los datos con las relaciones cargadas
      result.data = rolesWithPermissions;
    }

    return result;
  }

  async create(createRoleDto: CreateRoleDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { permissionIds, ...roleData } = createRoleDto;

      // 1. Crear el rol
      const role = queryRunner.manager.create(Role, roleData);
      await queryRunner.manager.save(Role, role);

      // 2. Asignar permisos si existen
      if (permissionIds?.length) {
        const permissions = await queryRunner.manager.find(Permission, {
          where: {
            id: In(permissionIds),
          },
        });

        // Validar que todos los permisos existan
        if (permissions.length !== permissionIds.length) {
          throw new BadRequestException('Algunos permisos no existen');
        }

        const rolePermissions = permissions.map((permission) =>
          queryRunner.manager.create(RolePermission, {
            role,
            permission,
          }),
        );

        await queryRunner.manager.save(RolePermission, rolePermissions);
      }

      // 3. Obtener el rol con sus relaciones dentro de la transacción
      const createdRole = await queryRunner.manager.findOne(Role, {
        where: { id: role.id },
        relations: ['permissions', 'permissions.permission'],
      });

      // 4. Solo hacer commit si todo salió bien
      await queryRunner.commitTransaction();

      // 5. Emitir evento para invalidación de caché
      if (createdRole) {
        this.eventEmitter.emit('role.created', {
          id: createdRole.id,
          operation: 'created',
          data: createdRole
        });
      }

      return createdRole;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.handleDbErrors(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return await this.rolesRepository.find();
  }

  async findOne(id: string) {
    const role = await this.rolesRepository.findOneBy({ id });
    if (!role) {
      throw new BadRequestException(`Role with id ${id} not found`);
    }
    return role;
  }

 async update(id: string, updateRoleDto: UpdateRoleDto) {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const role = await queryRunner.manager.findOne(Role, {
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    // 1. Actualizar campos básicos si vienen en el DTO
    queryRunner.manager.merge(Role, role, updateRoleDto);
    await queryRunner.manager.save(Role, role);

    // 2. Si vienen nuevos permisos, reasignarlos (reemplaza completamente los permisos)
    if (updateRoleDto.permissionIds !== undefined) {
      // Borrar permisos actuales del rol
      await queryRunner.manager.delete(RolePermission, { role: { id: role.id } });

      // Solo asignar nuevos permisos si el array no está vacío
      if (updateRoleDto.permissionIds.length > 0) {
        // Buscar permisos nuevos
        const permissions = await queryRunner.manager.find(Permission, {
          where: { id: In(updateRoleDto.permissionIds) },
        });

        if (permissions.length !== updateRoleDto.permissionIds.length) {
          throw new BadRequestException('Algunos permisos no existen');
        }

        // Crear nuevas relaciones
        const rolePermissions = permissions.map(permission =>
          queryRunner.manager.create(RolePermission, {
            role,
            permission,
          }),
        );

        await queryRunner.manager.save(RolePermission, rolePermissions);
      }
    }

    // 3. Obtener el rol actualizado con sus relaciones dentro de la transacción
    const updatedRole = await queryRunner.manager.findOne(Role, {
      where: { id: role.id },
      relations: ['permissions', 'permissions.permission'],
    });

    // 4. Solo hacer commit si todo salió bien
    await queryRunner.commitTransaction();

    // 5. Emitir evento para invalidación de caché
    if (updatedRole) {
      this.eventEmitter.emit('role.updated', {
        id: updatedRole.id,
        operation: 'updated',
        data: updatedRole
      });
    }

    return updatedRole;

  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    this.handleDbErrors(error);
  } finally {
    await queryRunner.release();
  }
}
  async remove(id: string) {
    const role = await this.findOne(id);
    role.isActive = false;
    await this.rolesRepository.save(role);

    // Emitir evento para invalidación de caché
    this.eventEmitter.emit('role.deleted', {
      id: role.id,
      operation: 'deleted',
      data: { id: role.id, isActive: false }
    });

    return { message: `Rol con ID ${id} eliminado exitosamente` };
  }


  private handleDbErrors(error: any): never {
    this.logger.error('Database error in RolesService:', error);

    // Si es una excepción de NestJS que ya lanzamos, la re-lanzamos
    if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException) {
      throw error;
    }

    if (error.code === '23505') {
      // unique constraint error
      throw new BadRequestException(error.detail);
    }
    if (error.code === '23503') {
      // foreign key violation
      throw new BadRequestException('Foreign key constraint failed');
    }

    this.logger.error(`Unhandled database error code: ${error.code}`, error.stack);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
