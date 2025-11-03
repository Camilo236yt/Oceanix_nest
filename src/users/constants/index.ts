export const USER_MESSAGES = {
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  EMAIL_ALREADY_REGISTERED: 'El email ya está registrado',
  USER_NOT_FOUND: 'Usuario no encontrado',
  INVALID_CURRENT_PASSWORD: 'La contraseña actual es incorrecta',
  USER_DEACTIVATED: 'Usuario desactivado correctamente',
  PASSWORD_CHANGED: 'Contraseña actualizada correctamente',
  SUPER_ADMIN_CANNOT_HAVE_ENTERPRISE: 'SUPER_ADMIN cannot belong to an enterprise',
  NON_SUPER_ADMIN_MUST_HAVE_ENTERPRISE: 'Non SUPER_ADMIN users must belong to an enterprise',
} as const;

export const USER_CACHE = {
  USERS_LIST_TTL: 600,      // 10 minutos
  USER_DETAIL_TTL: 300,     // 5 minutos
} as const;
