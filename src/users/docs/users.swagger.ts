import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { AssignRolesDto } from '../dto/assign-roles.dto';

export const UsersApiTags = () => ApiTags('Users');

export const CreateUserDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Crear un nuevo usuario',
      description: 'Crea un nuevo usuario en el sistema. El usuario será asociado a la empresa del usuario autenticado.',
    }),
    ApiBody({
      type: CreateUserDto,
      examples: {
        employee: {
          summary: 'Crear empleado',
          value: {
            name: 'Juan',
            lastName: 'Pérez',
            email: 'juan.perez@techcorp.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            phoneNumber: '+573001234567',
            userType: 'EMPLOYEE',
            addressId: '550e8400-e29b-41d4-a716-446655440000',
            identificationType: 'CC',
            identificationNumber: '1234567890',
          },
        },
        client: {
          summary: 'Crear cliente',
          value: {
            name: 'María',
            lastName: 'González',
            email: 'maria.gonzalez@example.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            phoneNumber: '+573009876543',
            userType: 'CLIENT',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Usuario creado exitosamente',
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@techcorp.com',
          phoneNumber: '+573001234567',
          userType: 'EMPLOYEE',
          enterpriseId: '550e8400-e29b-41d4-a716-446655440000',
          isActive: true,
          isEmailVerified: false,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Error de validación - Email ya existe o datos inválidos',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token inválido o expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos para crear usuarios',
    }),
  );

export const FindAllUsersDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Obtener usuarios con paginación y filtros',
      description: `Retorna una lista paginada de usuarios con soporte para filtros y búsqueda.

      **Paginación:** page, limit
      **Búsqueda:** search (busca en nombre, apellido, email)
      **Filtros:**
      - filter.userType: $eq, $in (EMPLOYEE, CLIENT, etc.)
      - filter.isActive: $eq
      - filter.createdAt: $gte, $lte, $btw
      **Ordenamiento:** sortBy (createdAt, name, lastName, email, userType)

      **Ejemplos:**
      - ?page=1&limit=10 → Primera página con 10 usuarios
      - ?search=juan → Buscar usuarios con "juan" en nombre/apellido/email
      - ?filter.userType=$eq:EMPLOYEE → Solo empleados
      - ?filter.isActive=$eq:true&sortBy=name:ASC → Usuarios activos ordenados por nombre`,
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuarios obtenida exitosamente',
      schema: {
        example: {
          data: [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Juan',
              lastName: 'Pérez',
              email: 'juan.perez@techcorp.com',
              phoneNumber: '+573001234567',
              userType: 'EMPLOYEE',
              enterpriseId: '550e8400-e29b-41d4-a716-446655440000',
              isActive: true,
              isEmailVerified: true,
            },
          ],
          meta: {
            itemsPerPage: 10,
            totalItems: 45,
            currentPage: 1,
            totalPages: 5,
          },
          links: {
            first: '?page=1&limit=10',
            previous: null,
            current: '?page=1&limit=10',
            next: '?page=2&limit=10',
            last: '?page=5&limit=10',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos para ver usuarios',
    }),
  );

export const FindOneUserDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Obtener un usuario por ID',
      description: 'Retorna los detalles completos de un usuario específico incluyendo sus roles.',
    }),
    ApiParam({
      name: 'id',
      description: 'UUID del usuario',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario encontrado exitosamente',
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@techcorp.com',
          phoneNumber: '+573001234567',
          userType: 'EMPLOYEE',
          enterpriseId: '550e8400-e29b-41d4-a716-446655440000',
          isActive: true,
          isEmailVerified: true,
          roles: [
            {
              id: '550e8400-e29b-41d4-a716-446655440002',
              roleId: '550e8400-e29b-41d4-a716-446655440003',
              role: {
                name: 'Administrador techcorp',
                description: 'Administrator with full access',
              },
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos',
    }),
  );

export const UpdateUserDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Actualizar un usuario',
      description: 'Actualiza la información de un usuario. Solo se pueden actualizar usuarios de la misma empresa.',
    }),
    ApiParam({
      name: 'id',
      description: 'UUID del usuario',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiBody({
      type: UpdateUserDto,
      examples: {
        updateBasicInfo: {
          summary: 'Actualizar información básica',
          value: {
            name: 'Juan Carlos',
            phoneNumber: '+573001111111',
          },
        },
        updateEmail: {
          summary: 'Actualizar email',
          value: {
            email: 'nuevo.email@techcorp.com',
          },
        },
        deactivate: {
          summary: 'Desactivar usuario',
          value: {
            isActive: false,
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario actualizado exitosamente',
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Juan Carlos',
          lastName: 'Pérez',
          email: 'nuevo.email@techcorp.com',
          phoneNumber: '+573001111111',
          userType: 'EMPLOYEE',
          isActive: true,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Error de validación - Email ya existe',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos',
    }),
  );

export const DeleteUserDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Eliminar un usuario (soft delete)',
      description: 'Desactiva un usuario estableciendo isActive en false. El usuario permanece en la base de datos.',
    }),
    ApiParam({
      name: 'id',
      description: 'UUID del usuario',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario eliminado exitosamente',
      schema: {
        example: {
          message: 'Usuario eliminado correctamente',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos',
    }),
  );

export const ChangePasswordDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Cambiar contraseña del usuario autenticado',
      description: 'Permite al usuario cambiar su propia contraseña. Requiere la contraseña actual.',
    }),
    ApiBody({
      type: ChangePasswordDto,
      examples: {
        changePassword: {
          summary: 'Cambiar contraseña',
          value: {
            currentPassword: 'Password123!',
            newPassword: 'NewPassword456!',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Contraseña cambiada exitosamente',
      schema: {
        example: {
          message: 'Contraseña actualizada correctamente',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Contraseña actual incorrecta o nueva contraseña inválida',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
  );

export const AssignRolesDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Asignar roles a un usuario',
      description: 'Asigna uno o varios roles a un usuario. Los roles deben pertenecer a la misma empresa.',
    }),
    ApiParam({
      name: 'userId',
      description: 'UUID del usuario',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiBody({
      type: AssignRolesDto,
      examples: {
        singleRole: {
          summary: 'Asignar un rol',
          value: {
            roleIds: ['550e8400-e29b-41d4-a716-446655440003'],
          },
        },
        multipleRoles: {
          summary: 'Asignar múltiples roles',
          value: {
            roleIds: [
              '550e8400-e29b-41d4-a716-446655440003',
              '550e8400-e29b-41d4-a716-446655440004',
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Roles asignados exitosamente',
      schema: {
        example: {
          message: 'Roles asignados correctamente',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Error - Rol no encontrado o no pertenece a la empresa',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos',
    }),
  );

export const RemoveRoleDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Remover un rol de un usuario',
      description: 'Elimina la asignación de un rol específico de un usuario.',
    }),
    ApiParam({
      name: 'userId',
      description: 'UUID del usuario',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiParam({
      name: 'roleId',
      description: 'UUID del rol',
      example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    ApiResponse({
      status: 200,
      description: 'Rol removido exitosamente',
      schema: {
        example: {
          message: 'Rol removido correctamente',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario o rol no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos',
    }),
  );

export const GetUserRolesDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Obtener roles de un usuario',
      description: 'Retorna la lista de roles asignados a un usuario específico.',
    }),
    ApiParam({
      name: 'userId',
      description: 'UUID del usuario',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiResponse({
      status: 200,
      description: 'Roles obtenidos exitosamente',
      schema: {
        example: {
          userId: '550e8400-e29b-41d4-a716-446655440001',
          roles: [
            {
              id: '550e8400-e29b-41d4-a716-446655440010',
              roleId: '550e8400-e29b-41d4-a716-446655440003',
              roleName: 'Administrador techcorp',
              roleDescription: 'Administrator with full access',
              enterpriseId: '550e8400-e29b-41d4-a716-446655440000',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos',
    }),
  );
