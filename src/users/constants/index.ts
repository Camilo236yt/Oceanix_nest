export * from './identification-types';

export const USER_MESSAGES = {
  // Password validations
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  PASSWORD_BOTH_REQUIRED: 'Debe enviar ambas contraseñas para actualizar la contraseña',
  INVALID_CURRENT_PASSWORD: 'La contraseña actual es incorrecta',
  PASSWORD_CHANGED: 'Contraseña actualizada correctamente',

  // User CRUD
  EMAIL_ALREADY_REGISTERED: 'El email ya está registrado',
  USER_NOT_FOUND: 'Usuario no encontrado',
  USER_DEACTIVATED: 'Usuario desactivado correctamente',
  USER_ALREADY_ACTIVE: 'El usuario ya está activo',
  USER_REACTIVATED: 'Usuario reactivado correctamente',
  USER_CREATED_BUT_NOT_RETRIEVED: 'User was created but could not be retrieved',

  // User type restrictions
  ENTERPRISE_ADMIN_USER_TYPE_RESTRICTION: 'Enterprise admins can only create EMPLOYEE or CLIENT users',
  SUPER_ADMIN_CANNOT_HAVE_ENTERPRISE: 'SUPER_ADMIN cannot belong to an enterprise',
  NON_SUPER_ADMIN_MUST_HAVE_ENTERPRISE: 'Non SUPER_ADMIN users must belong to an enterprise',

  // Role assignment
  ONLY_ENTERPRISE_USERS_CAN_ASSIGN_ROLES: 'Only enterprise users can assign roles',
  ONLY_ENTERPRISE_USERS_CAN_REMOVE_ROLES: 'Only enterprise users can remove roles',
  ROLES_ASSIGNED_SUCCESSFULLY: 'Roles assigned successfully',
  ROLE_REMOVED_SUCCESSFULLY: 'Role removed successfully',
  CANNOT_ASSIGN_ROLES_WITHOUT_ENTERPRISE: 'Cannot assign roles without an enterprise context',
  ROLES_NOT_FOUND_OR_INACTIVE: 'One or more roles not found or inactive',
  CANNOT_ASSIGN_ROLES_FROM_OTHER_ENTERPRISES: 'Cannot assign roles from other enterprises or inactive roles',
  CANNOT_ASSIGN_ROLES_TO_OTHER_ENTERPRISE_USERS: 'Cannot assign roles to users from other enterprises',
  CANNOT_REMOVE_ROLES_FROM_OTHER_ENTERPRISE_USERS: 'Cannot remove roles from users of other enterprises',
  USER_DOES_NOT_HAVE_ROLE: 'User does not have this role assigned',
  CANNOT_ACCESS_ROLES_FROM_OTHER_ENTERPRISES: 'Cannot access roles of users from other enterprises',
} as const;

export const USER_CACHE = {
  USERS_LIST_TTL: 600,      // 10 minutos
  USER_DETAIL_TTL: 300,     // 5 minutos
} as const;
