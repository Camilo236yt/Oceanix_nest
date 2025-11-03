import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { In, Repository, IsNull } from 'typeorm';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';

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
      const { permissionIds, ...roleData } = createRoleDto;

      // Validate uniqueness by enterprise
      const existing = await this.rolesRepository.findOne({
        where: {
          name: roleData.name,
          enterpriseId: enterpriseId ? enterpriseId : IsNull(),
        },
      });

      if (existing) {
        throw new BadRequestException('Role name already exists in this enterprise');
      }

      // Create the role
      const role = this.rolesRepository.create({
        ...roleData,
        enterpriseId,
      });
      await this.rolesRepository.save(role);

      // Assign permissions if provided
      if (permissionIds?.length) {
        const permissions = await this.permissionRepository.find({
          where: { id: In(permissionIds) },
        });

        if (permissions.length !== permissionIds.length) {
          throw new BadRequestException('Algunos permisos no existen');
        }

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
    const where = enterpriseId ? { enterpriseId } : {};
    return await this.rolesRepository.find({
      where,
      relations: ['permissions', 'permissions.permission'],
    });
  }

  async findOne(id: string) {
    const role = await this.rolesRepository.findOneBy({ id });
    if (!role) {
      throw new BadRequestException(`Role with id ${id} not found`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    try {
      const role = await this.rolesRepository.findOneBy({ id });

      if (!role) {
        throw new NotFoundException(`Rol con ID ${id} no encontrado`);
      }

      // Update basic fields if provided
      this.rolesRepository.merge(role, updateRoleDto);
      await this.rolesRepository.save(role);

      // If permissions are provided, replace them completely
      if (updateRoleDto.permissionIds !== undefined) {
        // Delete current permissions
        await this.rolePermissionRepository.delete({ role: { id: role.id } });

        // Assign new permissions if array is not empty
        if (updateRoleDto.permissionIds.length > 0) {
          const permissions = await this.permissionRepository.find({
            where: { id: In(updateRoleDto.permissionIds) },
          });

          if (permissions.length !== updateRoleDto.permissionIds.length) {
            throw new BadRequestException('Algunos permisos no existen');
          }

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

  async remove(id: string) {
    const role = await this.findOne(id);
    role.isActive = false;
    await this.rolesRepository.save(role);

    return { message: `Rol con ID ${id} eliminado exitosamente` };
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
      throw new BadRequestException('Foreign key constraint failed');
    }

    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
