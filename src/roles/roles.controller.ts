import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { Auth } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';
import { Cached } from 'src/common/decorators';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService
  ) {}

  @Auth(ValidPermission.createRoles, ValidPermission.manageRoles)
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.create(createRoleDto);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get()
  @Cached({ keyPrefix: 'roles', ttl: 600 })
  async findAll() {
   return await this.rolesService.findAll();
   
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get(':id')
  @Cached({ keyPrefix: 'roles', ttl: 600 })
  async findOne(@Param('id') id: string) {
    return await this.rolesService.findOne(id);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.editRoles)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.rolesService.update(id, updateRoleDto);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.deleteRoles)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.rolesService.remove(id);
  }
}
