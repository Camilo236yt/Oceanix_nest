import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';

import { Auth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces';
import type { EnrichedJwtUser } from 'src/auth/interfaces';
import { Cached } from 'src/common/decorators';

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
    @GetUser() currentUser: EnrichedJwtUser
  ) {
    // Pass enterpriseId for tenant isolation
    return await this.rolesService.create(createRoleDto, currentUser.enterpriseId ?? undefined);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get()
  @Cached({ keyPrefix: 'roles', ttl: 600 })
  @FindAllRolesDoc()
  async findAll(@GetUser() currentUser: EnrichedJwtUser) {
    this.logger.log(`📋 GET /roles - User: ${currentUser.email}, Enterprise: ${currentUser.enterpriseId || 'N/A'}`);
    this.logger.log(`👥 User roles: ${currentUser.roles?.map(r => r.name).join(', ') || 'None'}`);

    // Pass enterpriseId for tenant isolation (SUPER_ADMIN will have undefined, can see all)
    const roles = await this.rolesService.findAll(currentUser.enterpriseId ?? undefined);

    this.logger.log(`✅ Returning ${roles.length} roles`);
    return roles;
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get(':id')
  @Cached({ keyPrefix: 'roles', ttl: 600 })
  @FindOneRoleDoc()
  async findOne(
    @Param('id') id: string,
    @GetUser() currentUser: EnrichedJwtUser
  ) {
    return await this.rolesService.findOne(id, currentUser.enterpriseId ?? undefined);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.editRoles)
  @Patch(':id')
  @UpdateRoleDoc()
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @GetUser() currentUser: EnrichedJwtUser
  ) {
    return await this.rolesService.update(id, updateRoleDto, currentUser.enterpriseId ?? undefined);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.deleteRoles)
  @Delete(':id')
  @DeleteRoleDoc()
  async remove(
    @Param('id') id: string,
    @GetUser() currentUser: EnrichedJwtUser
  ) {
    return await this.rolesService.remove(id, currentUser.enterpriseId ?? undefined);
  }
}
