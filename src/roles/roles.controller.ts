import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';
import { Cached } from 'src/common/decorators';
import { User } from 'src/users/entities/user.entity';

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
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @GetUser() currentUser: User
  ) {
    // Pass enterpriseId for tenant isolation
    return await this.rolesService.create(createRoleDto, currentUser.enterpriseId);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get()
  @Cached({ keyPrefix: 'roles', ttl: 600 })
  async findAll(@GetUser() currentUser: User) {
    // Pass enterpriseId for tenant isolation (SUPER_ADMIN will have undefined, can see all)
    return await this.rolesService.findAll(currentUser.enterpriseId);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get(':id')
  @Cached({ keyPrefix: 'roles', ttl: 600 })
  async findOne(
    @Param('id') id: string,
    @GetUser() currentUser: User
  ) {
    return await this.rolesService.findOne(id, currentUser.enterpriseId);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.editRoles)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @GetUser() currentUser: User
  ) {
    return await this.rolesService.update(id, updateRoleDto, currentUser.enterpriseId);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.deleteRoles)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetUser() currentUser: User
  ) {
    return await this.rolesService.remove(id, currentUser.enterpriseId);
  }
}
