/**
 * Datos de usuarios por rol
 * Los usuarios se crean con email template: {name}@{subdomain}.com
 */
export interface UserData {
  name: string;
  lastName: string;
  emailPrefix: string; // Será concatenado con @{subdomain}.com
  phoneNumber: string;
  roleIndex: number; // Índice del rol en ROLES_DATA (0-3)
}

export const USERS_DATA: UserData[] = [
  // Usuario 1: Super Admin
  {
    name: 'Admin',
    lastName: 'Super',
    emailPrefix: 'admin.super',
    phoneNumber: '+573026736193',
    roleIndex: 0,
  },

  // Usuario 2: Cliente 1
  {
    name: 'Cliente',
    lastName: 'Uno',
    emailPrefix: 'cliente1',
    phoneNumber: '+573026736193',
    roleIndex: 1,
  },

  // Usuario 3: Cliente 2
  {
    name: 'Cliente',
    lastName: 'Dos',
    emailPrefix: 'cliente2',
    phoneNumber: '+573026736193',
    roleIndex: 2,
  },

  // Usuario 4: Cliente 3
  {
    name: 'Cliente',
    lastName: 'Tres',
    emailPrefix: 'cliente3',
    phoneNumber: '+573026736193',
    roleIndex: 3,
  },

  // Usuario 5: Cliente 4 - Solo ver incidencias y usuarios
  {
    name: 'Cliente',
    lastName: 'Cuatro',
    emailPrefix: 'cliente4',
    phoneNumber: '+573026736193',
    roleIndex: 4,
  },
];

/**
 * Datos del Super Admin del sistema (sin empresa)
 */
export const SUPER_ADMIN_DATA = {
  name: 'Super',
  lastName: 'Admin',
  email: 'superadmin@oceanix.space',
  phoneNumber: '+573026736193',
  password: 'SuperAdmin123!',
};

/**
 * Contraseña común para todos los usuarios de empresas
 */
export const DEFAULT_USER_PASSWORD = 'Password123!';
