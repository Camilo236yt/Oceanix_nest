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

    
    try{
        
      const permission =  this.permissionRepository.create(createPermissionDto);

      return await this.permissionRepository.save(permission);

    } catch (error) {
      
    }




    return 'This action adds a new permission';
  }

  findAll() {

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

    const Permission = await this.permissionRepository.findOne({
      where: {
        id,
        isActive: true,
        },
        });

    if (!Permission)  throw new NotFoundException(`Permission with id ${id} not found`);
    
    return Permission;

  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {

    const permission = await this.permissionRepository.preload({
      id,
      ...updatePermissionDto,
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
