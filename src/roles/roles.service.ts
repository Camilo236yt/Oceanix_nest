import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { In, Repository, IsNull } from 'typeorm';
import { paginate, Paginated, FilterOperator } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { ROLE_MESSAGES } from './constants';
import { ValidPermission } from 'src/auth/interfaces';
import { createPaginationConfig } from '../common/helpers/pagination.config';

// Permisos que se auto-asignan cuando canReceiveIncidents = true
const RECEIVE_INCIDENTS_PERMISSIONS = [
  ValidPermission.viewOwnIncidents,
  ValidPermission.editOwnIncidents,
];

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async create(createRoleDto: CreateRoleDto, enterpriseId?: string) {
    try {
      const { permissionIds, canReceiveIncidents, ...roleData } = createRoleDto;

      // Validate uniqueness by enterprise
      const existing = await this.rolesRepository.findOne({
        where: {
          name: roleData.name,
          enterpriseId: enterpriseId ? enterpriseId : IsNull(),
        },
      });

      if (existing) {
        throw new BadRequestException(ROLE_MESSAGES.NAME_ALREADY_EXISTS);
      }

      // Create the role
      const role = this.rolesRepository.create({
        ...roleData,
        enterpriseId,
        canReceiveIncidents: canReceiveIncidents ?? false,
      });
      await this.rolesRepository.save(role);

      // Collect all permission IDs to assign
      let allPermissionIds = [...(permissionIds || [])];

      // Auto-assign permissions if canReceiveIncidents is true
      if (canReceiveIncidents) {
        const autoPermissions = await this.permissionRepository.find({
          where: { name: In(RECEIVE_INCIDENTS_PERMISSIONS) },
        });
        const autoPermissionIds = autoPermissions.map(p => p.id);
        // Merge without duplicates
        allPermissionIds = [...new Set([...allPermissionIds, ...autoPermissionIds])];
      }

      // Assign permissions if any
      if (allPermissionIds.length) {
        const permissions = await this.permissionRepository.find({
          where: { id: In(allPermissionIds) },
        });

        const rolePermissions = permissions.map((permission) =>
          this.rolePermissionRepository.create({
            role,
            permission,
          }),
        );

        await this.rolePermissionRepository.save(rolePermissions);
      }

      return role;
    } catch (error) {
      this.handleDbErrors(error);
    }
  }

  async findAll(enterpriseId?: string) {
    // IMPORTANTE: Siempre filtrar por enterpriseId para aislamiento multi-tenant
    // Si no se proporciona enterpriseId, solo retornar roles globales (null)
    const where = enterpriseId
      ? { enterpriseId }
      : { enterpriseId: IsNull() };

    console.log('[RolesService.findAll] EnterpriseId received:', enterpriseId);
    console.log('[RolesService.findAll] Where clause:', JSON.stringify(where));

    const roles = await this.rolesRepository.find({
      where,
      relations: ['permissions', 'permissions.permission'],
    });

    console.log('[RolesService.findAll] Roles found:', roles.length);
    return roles;
  }

  /**
   * Lista roles con paginación, filtros y búsqueda
   */
  async findAllPaginated(
    query: PaginateQuery,
    enterpriseId?: string,
  ): Promise<Paginated<Role>> {
    const where = enterpriseId
      ? { enterpriseId }
      : { enterpriseId: IsNull() };

    const config = createPaginationConfig<Role>({
      sortableColumns: ['createdAt', 'name', 'isActive'],
      searchableColumns: ['name', 'description'],
      filterableColumns: {
        isActive: [FilterOperator.EQ],
        isSystemRole: [FilterOperator.EQ],
        canReceiveIncidents: [FilterOperator.EQ],
        createdAt: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
      },
      defaultSortBy: [['name', 'ASC']],
      where,
      relations: ['permissions', 'permissions.permission'],
    });

    return paginate(query, this.rolesRepository, config);
  }

  async findOne(id: string, enterpriseId?: string, validateActive = true) {
    const where: any = { id };

    if (validateActive) {
      where.isActive = true;
    }

    // Add enterprise isolation (SUPER_ADMIN bypass by not passing enterpriseId)
    if (enterpriseId !== undefined) {
      where.enterpriseId = enterpriseId;
    }

    // Optimizado: Solo cargamos 2 niveles de relaciones (role → permission → name/title)
    // No cargamos parent/children de permissions para mejor performance
    const role = await this.rolesRepository.findOne({
      where,
      relations: ['permissions', 'permissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.NOT_FOUND);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, enterpriseId?: string) {
    try {
      // Use findOne with enterprise isolation
      const role = await this.findOne(id, enterpriseId);

      const { permissionIds, canReceiveIncidents, ...basicFields } = updateRoleDto;

      // Update basic fields if provided (including canReceiveIncidents)
      if (canReceiveIncidents !== undefined) {
        role.canReceiveIncidents = canReceiveIncidents;
      }
      this.rolesRepository.merge(role, basicFields);
      await this.rolesRepository.save(role);

      // If permissions are provided OR canReceiveIncidents changed, update permissions
      if (permissionIds !== undefined || canReceiveIncidents !== undefined) {
        // Delete current permissions
        await this.rolePermissionRepository.delete({ role: { id: role.id } });

        // Collect all permission IDs to assign
        let allPermissionIds = [...(permissionIds || [])];

        // Auto-assign permissions if canReceiveIncidents is true
        if (role.canReceiveIncidents) {
          const autoPermissions = await this.permissionRepository.find({
            where: { name: In(RECEIVE_INCIDENTS_PERMISSIONS) },
          });
          const autoPermissionIds = autoPermissions.map(p => p.id);
          // Merge without duplicates
          allPermissionIds = [...new Set([...allPermissionIds, ...autoPermissionIds])];
        }

        // Assign new permissions if array is not empty
        if (allPermissionIds.length > 0) {
          const permissions = await this.permissionRepository.find({
            where: { id: In(allPermissionIds) },
          });

          const rolePermissions = permissions.map(permission =>
            this.rolePermissionRepository.create({
              role,
              permission,
            }),
          );

          await this.rolePermissionRepository.save(rolePermissions);
        }
      }

      return role;
    } catch (error) {
      this.handleDbErrors(error);
    }
  }

  async remove(id: string, enterpriseId?: string) {
    // Use findOne with enterprise isolation
    const role = await this.findOne(id, enterpriseId);
    role.isActive = false;
    await this.rolesRepository.save(role);

    return { message: ROLE_MESSAGES.DELETED_SUCCESSFULLY };
  }


  private handleDbErrors(error: any): never {
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
      throw new BadRequestException(ROLE_MESSAGES.FOREIGN_KEY_CONSTRAINT);
    }

    throw new InternalServerErrorException(ROLE_MESSAGES.UNEXPECTED_ERROR);
  }
}
