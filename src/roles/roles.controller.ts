import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';

import { Auth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces';
import { User } from 'src/users/entities/user.entity';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';
import {
  RolesApiTags,
  CreateRoleDoc,
  FindAllRolesDoc,
  FindOneRoleDoc,
  UpdateRoleDoc,
  DeleteRoleDoc,
} from './docs';

@RolesApiTags()
@ApiCookieAuth('authToken')
@Controller('roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(
    private readonly rolesService: RolesService
  ) {}

  @Auth(ValidPermission.createRoles, ValidPermission.manageRoles)
  @Post()
  @CreateRoleDoc()
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @GetUser() currentUser: User
  ) {
    return await this.rolesService.create(createRoleDto, currentUser.enterpriseId ?? undefined);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get()
  @FindAllRolesDoc()
  async findAll(@GetUser() currentUser: User) {
    this.logger.log(`[findAll] User: ${currentUser.email}, EnterpriseId: ${currentUser.enterpriseId}, UserType: ${currentUser.userType}`);
    return await this.rolesService.findAll(currentUser.enterpriseId ?? undefined);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get(':id')
  @FindOneRoleDoc()
  async findOne(
    @Param('id') id: string,
    @GetUser() currentUser: User
  ) {
    return await this.rolesService.findOne(id, currentUser.enterpriseId ?? undefined);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.editRoles)
  @Patch(':id')
  @UpdateRoleDoc()
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @GetUser() currentUser: User
  ) {
    return await this.rolesService.update(id, updateRoleDto, currentUser.enterpriseId ?? undefined);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.deleteRoles)
  @Delete(':id')
  @DeleteRoleDoc()
  async remove(
    @Param('id') id: string,
    @GetUser() currentUser: User
  ) {
    return await this.rolesService.remove(id, currentUser.enterpriseId ?? undefined);
  }
}
