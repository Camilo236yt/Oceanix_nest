import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

import { Auth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';
import { Cached } from 'src/common/decorators';
import { User } from 'src/users/entities/user.entity';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService
  ) {}

  @Auth(ValidPermission.createRoles, ValidPermission.manageRoles)
  @Post()
  @ApiOperation({
    summary: 'Create a new role',
    description: 'Creates a new role with optional permissions for the authenticated user\'s enterprise'
  })
  @ApiBody({
    type: CreateRoleDto,
    examples: {
      withPermissions: {
        summary: 'Role with permissions',
        value: {
          name: 'Support Agent',
          description: 'Agent responsible for handling customer support tickets',
          permissionIds: [
            '550e8400-e29b-41d4-a716-446655440001',
            '550e8400-e29b-41d4-a716-446655440002'
          ]
        }
      },
      withoutPermissions: {
        summary: 'Role without permissions',
        value: {
          name: 'Basic User',
          description: 'Basic user with minimal access'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Support Agent',
        description: 'Agent responsible for handling customer support tickets',
        enterpriseId: '550e8400-e29b-41d4-a716-446655440099',
        isActive: true,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-14T10:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed or role name already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Get all roles',
    description: 'Retrieves all roles for the authenticated user\'s enterprise. SUPER_ADMIN users can see all roles from all enterprises.'
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles retrieved successfully',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Administrador de Incidencias',
          description: 'Full access to incident management',
          enterpriseId: '550e8400-e29b-41d4-a716-446655440099',
          isActive: true,
          createdAt: '2025-01-14T10:00:00.000Z',
          updatedAt: '2025-01-14T10:00:00.000Z',
          permissions: [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              roleId: '550e8400-e29b-41d4-a716-446655440000',
              permissionId: '550e8400-e29b-41d4-a716-446655440010',
              permission: {
                id: '550e8400-e29b-41d4-a716-446655440010',
                name: 'manage_incidents',
                title: 'Manage Incidents',
                description: 'Full access to incident management'
              }
            }
          ]
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async findAll(@GetUser() currentUser: User) {
    // Pass enterpriseId for tenant isolation (SUPER_ADMIN will have undefined, can see all)
    return await this.rolesService.findAll(currentUser.enterpriseId);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.getRoles)
  @Get(':id')
  @Cached({ keyPrefix: 'roles', ttl: 600 })
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Retrieves a specific role by its ID. Only roles from the user\'s enterprise are accessible (unless SUPER_ADMIN).'
  })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Administrador de Incidencias',
        description: 'Full access to incident management',
        enterpriseId: '550e8400-e29b-41d4-a716-446655440099',
        isActive: true,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-14T10:00:00.000Z',
        permissions: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            roleId: '550e8400-e29b-41d4-a716-446655440000',
            permissionId: '550e8400-e29b-41d4-a716-446655440010',
            permission: {
              id: '550e8400-e29b-41d4-a716-446655440010',
              name: 'manage_incidents',
              title: 'Manage Incidents',
              description: 'Full access to incident management'
            }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Role does not exist or does not belong to user\'s enterprise' })
  async findOne(
    @Param('id') id: string,
    @GetUser() currentUser: User
  ) {
    return await this.rolesService.findOne(id, currentUser.enterpriseId);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.editRoles)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a role',
    description: 'Updates a role\'s information and/or permissions. Only roles from the user\'s enterprise can be updated.'
  })
  @ApiBody({
    type: UpdateRoleDto,
    examples: {
      updateBasicInfo: {
        summary: 'Update name and description',
        value: {
          name: 'Senior Support Agent',
          description: 'Senior agent with extended permissions'
        }
      },
      updatePermissions: {
        summary: 'Update permissions only',
        value: {
          permissionIds: [
            '550e8400-e29b-41d4-a716-446655440001',
            '550e8400-e29b-41d4-a716-446655440002',
            '550e8400-e29b-41d4-a716-446655440003'
          ]
        }
      },
      updateAll: {
        summary: 'Update everything',
        value: {
          name: 'Team Lead',
          description: 'Team leader with full management access',
          permissionIds: [
            '550e8400-e29b-41d4-a716-446655440001',
            '550e8400-e29b-41d4-a716-446655440002'
          ]
        }
      },
      removeAllPermissions: {
        summary: 'Remove all permissions',
        value: {
          permissionIds: []
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Senior Support Agent',
        description: 'Senior agent with extended permissions',
        enterpriseId: '550e8400-e29b-41d4-a716-446655440099',
        isActive: true,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-14T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed or invalid permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Role does not exist or does not belong to user\'s enterprise' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @GetUser() currentUser: User
  ) {
    return await this.rolesService.update(id, updateRoleDto, currentUser.enterpriseId);
  }

  @Auth(ValidPermission.manageRoles, ValidPermission.deleteRoles)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a role (soft delete)',
    description: 'Soft deletes a role by setting isActive to false. Only roles from the user\'s enterprise can be deleted.'
  })
  @ApiResponse({
    status: 200,
    description: 'Role deleted successfully',
    schema: {
      example: {
        message: 'Role deleted successfully'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - Role does not exist or does not belong to user\'s enterprise' })
  async remove(
    @Param('id') id: string,
    @GetUser() currentUser: User
  ) {
    return await this.rolesService.remove(id, currentUser.enterpriseId);
  }
}
