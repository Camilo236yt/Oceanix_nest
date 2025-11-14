// Error response schemas
export const ErrorResponses = {
  BadRequest: (description: string = 'Bad request') => ({
    status: 400,
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'Validation failed' },
            { type: 'array', items: { type: 'string' }, example: ['name must be at least 3 characters', 'permissionIds must be an array of UUIDs'] }
          ]
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  }),

  Unauthorized: (description: string = 'Unauthorized') => ({
    status: 401,
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid or missing authentication token' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  }),

  Forbidden: (description: string = 'Forbidden') => ({
    status: 403,
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Insufficient permissions' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  }),

  NotFound: (description: string = 'Resource not found') => ({
    status: 404,
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Role not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  }),
};

// Success response schemas
export const SuccessRoleResponse = {
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
      name: { type: 'string', example: 'Support Agent' },
      description: { type: 'string', example: 'Agent responsible for handling customer support tickets' },
      enterpriseId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440099' },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time', example: '2025-01-14T10:00:00.000Z' },
      updatedAt: { type: 'string', format: 'date-time', example: '2025-01-14T10:00:00.000Z' },
    },
  },
};

export const SuccessRoleWithPermissionsResponse = {
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
      name: { type: 'string', example: 'Administrador de Incidencias' },
      description: { type: 'string', example: 'Full access to incident management' },
      enterpriseId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440099' },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time', example: '2025-01-14T10:00:00.000Z' },
      updatedAt: { type: 'string', format: 'date-time', example: '2025-01-14T10:00:00.000Z' },
      permissions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' },
            roleId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            permissionId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440010' },
            permission: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440010' },
                name: { type: 'string', example: 'manage_incidents' },
                title: { type: 'string', example: 'Manage Incidents' },
                description: { type: 'string', example: 'Full access to incident management' },
              },
            },
          },
        },
      },
    },
  },
};

export const SuccessDeleteResponse = {
  schema: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Role deleted successfully' },
    },
  },
};

// Request body examples
export const RoleExamples = {
  CreateWithPermissions: {
    name: 'Support Agent',
    description: 'Agent responsible for handling customer support tickets',
    permissionIds: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002'
    ]
  },

  CreateWithoutPermissions: {
    name: 'Basic User',
    description: 'Basic user with minimal access'
  },

  UpdateBasicInfo: {
    name: 'Senior Support Agent',
    description: 'Senior agent with extended permissions'
  },

  UpdatePermissions: {
    permissionIds: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003'
    ]
  },

  UpdateAll: {
    name: 'Team Lead',
    description: 'Team leader with full management access',
    permissionIds: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002'
    ]
  },

  RemoveAllPermissions: {
    permissionIds: []
  },
};
