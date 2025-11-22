import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, Paginated, FilterOperator } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';
import { createPaginationConfig } from '../common/helpers/pagination.config';

@Injectable()
export class PermissionsService {

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { parentId, ...permissionData } = createPermissionDto;

    // Validar que el parent existe si se proporciona
    if (parentId) {
      const parentPermission = await this.findOne(parentId);
      if (!parentPermission) {
        throw new NotFoundException(`Parent permission with id ${parentId} not found`);
      }
    }

    const permission = this.permissionRepository.create({
      ...permissionData,
      ...(parentId && { parent: { id: parentId } }),
    });

    return await this.permissionRepository.save(permission);
  }

  findAll() {
    // No cargamos relaciones parent/children en listado para mejor performance
    return this.permissionRepository.find({
      where: {
        isActive: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  /**
   * Lista permisos con paginación, filtros y búsqueda
   */
  async findAllPaginated(query: PaginateQuery): Promise<Paginated<Permission>> {
    const config = createPaginationConfig<Permission>({
      sortableColumns: ['name', 'title', 'resource', 'createdAt'],
      searchableColumns: ['name', 'title', 'description'],
      filterableColumns: {
        resource: [FilterOperator.EQ, FilterOperator.IN],
        isActive: [FilterOperator.EQ],
        createdAt: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
      },
      defaultSortBy: [['name', 'ASC']],
      where: { isActive: true },
    });

    return paginate(query, this.permissionRepository, config);
  }

  async findOne(id: string) {
    // En detalle sí cargamos la jerarquía completa
    const permission = await this.permissionRepository.findOne({
      where: {
        id,
        isActive: true,
      },
      relations: ['parent', 'children'],
    });

    if (!permission) throw new NotFoundException(`Permission with id ${id} not found`);

    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    const { parentId, ...permissionData } = updatePermissionDto;

    // Validar que el parent existe si se proporciona
    if (parentId) {
      const parentPermission = await this.findOne(parentId);
      if (!parentPermission) {
        throw new NotFoundException(`Parent permission with id ${parentId} not found`);
      }
    }

    const permission = await this.permissionRepository.preload({
      id,
      ...permissionData,
      parent: parentId ? { id: parentId } : undefined,
    });

    if (!permission) {
      throw new NotFoundException(`Permission with id ${id} not found`);
    }

    return await this.permissionRepository.save(permission);
  }


  async remove(id: string) {
      const permission:Permission = await this.findOne(id);

      permission.isActive = false;
      return await this.permissionRepository.save(permission);
  }
}
