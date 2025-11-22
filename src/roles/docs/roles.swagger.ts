import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import {
  ErrorResponses,
  SuccessRoleResponse,
  SuccessRoleWithPermissionsResponse,
  SuccessDeleteResponse,
  RoleExamples,
} from './swagger.helpers';

export const RolesApiTags = () => ApiTags('Roles');

export const CreateRoleDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new role',
      description: `Creates a new role with optional permissions for the authenticated user's enterprise.

      **Enterprise Isolation:**
      - The role is automatically associated with the user's enterprise
      - Only users with 'create_roles' or 'manage_roles' permissions can create roles
      - Permission IDs must correspond to existing permissions in the system

      **Automatic Incident Assignment:**
      - Set canReceiveIncidents: true to enable automatic incident assignment for users with this role
      - When enabled, automatically grants 'viewOwnIncidents' and 'editOwnIncidents' permissions
      - Incidents are distributed among employees with eligible roles using load balancing (least workload)`
    }),
    ApiBody({
      type: CreateRoleDto,
      examples: {
        withPermissions: {
          summary: 'Role with permissions and incident assignment',
          description: 'Create a role that can receive automatic incident assignments',
          value: RoleExamples.CreateWithPermissions,
        },
        withoutPermissions: {
          summary: 'Role without permissions',
          description: 'Create a basic role without incident assignment capability',
          value: RoleExamples.CreateWithoutPermissions,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Role created successfully',
      ...SuccessRoleResponse,
    }),
    ApiResponse(ErrorResponses.BadRequest('Validation failed, role name already exists, or invalid permission IDs')),
    ApiResponse(ErrorResponses.Unauthorized('Invalid or missing authentication token')),
    ApiResponse(ErrorResponses.Forbidden('Insufficient permissions to create roles')),
  );

export const FindAllRolesDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get roles (all or paginated)',
      description: `Retrieves roles for the authenticated user's enterprise with their associated permissions.

      **Behavior:**
      - **Without query params:** Returns ALL roles (for dropdowns/selectors)
      - **With query params:** Returns paginated/filtered results (for lists/tables)

      **Pagination & Filters:**
      - page, limit: Control pagination
      - search: Search in name, description
      - filter.isActive, filter.isSystemRole, filter.canReceiveIncidents: Filter by fields
      - sortBy: Sort results

      **Enterprise Isolation:**
      - Regular users can only see roles from their own enterprise
      - SUPER_ADMIN users can see all roles from all enterprises
      - Results include permission details for each role

      **Examples:**
      - GET /roles → Returns all roles (array)
      - GET /roles?page=1&limit=10 → Returns paginated results
      - GET /roles?filter.canReceiveIncidents=$eq:true → Returns only roles that can receive incidents`
    }),
    ApiResponse({
      status: 200,
      description: 'List of roles retrieved successfully (array or paginated object)',
      schema: {
        oneOf: [
          {
            type: 'array',
            items: SuccessRoleWithPermissionsResponse.schema,
          },
          {
            type: 'object',
            properties: {
              data: { type: 'array', items: SuccessRoleWithPermissionsResponse.schema },
              meta: { type: 'object' },
              links: { type: 'object' },
            },
          },
        ],
      },
    }),
    ApiResponse(ErrorResponses.Unauthorized('Invalid or missing authentication token')),
    ApiResponse(ErrorResponses.Forbidden('Insufficient permissions to view roles')),
  );

export const FindOneRoleDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get role by ID',
      description: `Retrieves a specific role by its ID with all associated permissions.

      **Enterprise Isolation:**
      - Only roles from the user's enterprise are accessible
      - SUPER_ADMIN users can access roles from any enterprise
      - Returns 404 if role doesn't exist or doesn't belong to user's enterprise`
    }),
    ApiResponse({
      status: 200,
      description: 'Role retrieved successfully',
      ...SuccessRoleWithPermissionsResponse,
    }),
    ApiResponse(ErrorResponses.Unauthorized('Invalid or missing authentication token')),
    ApiResponse(ErrorResponses.Forbidden('Insufficient permissions to view roles')),
    ApiResponse(ErrorResponses.NotFound('Role does not exist or does not belong to user\'s enterprise')),
  );

export const UpdateRoleDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a role',
      description: `Updates a role's information and/or permissions. All fields are optional.

      **Permission Management:**
      - Providing permissionIds replaces ALL existing permissions
      - To remove all permissions, pass an empty array: permissionIds: []
      - To keep existing permissions unchanged, omit the permissionIds field

      **Incident Assignment:**
      - Update canReceiveIncidents to enable/disable automatic incident assignment
      - When enabled, automatically grants 'viewOwnIncidents' and 'editOwnIncidents' permissions

      **Enterprise Isolation:**
      - Only roles from the user's enterprise can be updated`
    }),
    ApiBody({
      type: UpdateRoleDto,
      examples: {
        updateBasicInfo: {
          summary: 'Update name and description',
          description: 'Update only the role name and description, keeping permissions unchanged',
          value: RoleExamples.UpdateBasicInfo,
        },
        updatePermissions: {
          summary: 'Update permissions only',
          description: 'Replace all existing permissions with new ones',
          value: RoleExamples.UpdatePermissions,
        },
        updateAll: {
          summary: 'Update everything',
          description: 'Update name, description, and permissions together',
          value: RoleExamples.UpdateAll,
        },
        removeAllPermissions: {
          summary: 'Remove all permissions',
          description: 'Remove all permissions from the role (useful for creating a "no access" role)',
          value: RoleExamples.RemoveAllPermissions,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Role updated successfully',
      ...SuccessRoleResponse,
    }),
    ApiResponse(ErrorResponses.BadRequest('Validation failed or invalid permission IDs')),
    ApiResponse(ErrorResponses.Unauthorized('Invalid or missing authentication token')),
    ApiResponse(ErrorResponses.Forbidden('Insufficient permissions to update roles')),
    ApiResponse(ErrorResponses.NotFound('Role does not exist or does not belong to user\'s enterprise')),
  );

export const DeleteRoleDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a role (soft delete)',
      description: `Soft deletes a role by setting isActive to false. The role is not permanently deleted from the database.

      **Important:**
      - This is a soft delete operation - the role remains in the database with isActive=false
      - Users assigned to this role may lose access to associated permissions
      - Only roles from the user's enterprise can be deleted`
    }),
    ApiResponse({
      status: 200,
      description: 'Role deleted successfully',
      ...SuccessDeleteResponse,
    }),
    ApiResponse(ErrorResponses.Unauthorized('Invalid or missing authentication token')),
    ApiResponse(ErrorResponses.Forbidden('Insufficient permissions to delete roles')),
    ApiResponse(ErrorResponses.NotFound('Role does not exist or does not belong to user\'s enterprise')),
  );
