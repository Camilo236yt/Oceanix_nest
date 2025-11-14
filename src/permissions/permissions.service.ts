import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
