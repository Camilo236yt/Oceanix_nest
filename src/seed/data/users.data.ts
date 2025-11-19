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
    phoneNumber: '+1234567799',
    roleIndex: 0,
  },

  // Usuario 2: Admin de Incidencias
  {
    name: 'Carlos',
    lastName: 'Rodríguez',
    emailPrefix: 'carlos.rodriguez',
    phoneNumber: '+1234567800',
    roleIndex: 1,
  },

  // Usuario 3: Admin de Usuarios
  {
    name: 'María',
    lastName: 'González',
    emailPrefix: 'maria.gonzalez',
    phoneNumber: '+1234567801',
    roleIndex: 2,
  },

  // Usuario 4: Visualizador
  {
    name: 'Juan',
    lastName: 'Pérez',
    emailPrefix: 'juan.perez',
    phoneNumber: '+1234567802',
    roleIndex: 3,
  },
];

/**
 * Datos del Super Admin del sistema (sin empresa)
 */
export const SUPER_ADMIN_DATA = {
  name: 'Super',
  lastName: 'Admin',
  email: 'superadmin@oceanix.space',
  phoneNumber: '+1000000000',
  password: 'SuperAdmin123!',
};

/**
 * Contraseña común para todos los usuarios de empresas
 */
export const DEFAULT_USER_PASSWORD = 'Password123!';
