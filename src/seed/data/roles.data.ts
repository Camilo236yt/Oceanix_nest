import { ValidPermission } from '../../auth/interfaces';

/**
 * Definición de roles por tipo
 */
export interface RoleData {
  nameTemplate: string; // Template con {subdomain} que será reemplazado
  description: string;
  permissions: ValidPermission[];
}

/**
 * Roles disponibles para cada empresa
 */
export const ROLES_DATA: RoleData[] = [
  // Rol 1: Super Admin (TODOS los permisos)
  {
    nameTemplate: 'Administrador {subdomain}',
    description: 'Administrator with full access to all system features',
    permissions: [], // Se asignarán todos los permisos dinámicamente
  },

  // Rol 2: Administrador de Incidencias
  {
    nameTemplate: 'Gestor de Incidencias {subdomain}',
    description: 'Puede gestionar todas las incidencias del sistema',
    permissions: [
      ValidPermission.manageIncidents,
      ValidPermission.createIncidents,
      ValidPermission.viewIncidents,
      ValidPermission.editIncidents,
      ValidPermission.deleteIncidents,
      ValidPermission.assignIncidents,
      ValidPermission.closeIncidents,
      ValidPermission.reopenIncidents,
      ValidPermission.readDashboard,
    ],
  },

  // Rol 3: Administrador de Usuarios
  {
    nameTemplate: 'Gestor de Usuarios {subdomain}',
    description: 'Puede gestionar usuarios y roles del sistema',
    permissions: [
      ValidPermission.manageUsers,
      ValidPermission.createUsers,
      ValidPermission.viewUsers,
      ValidPermission.editUsers,
      ValidPermission.deleteUsers,
      ValidPermission.manageRoles,
      ValidPermission.getRoles,
      ValidPermission.createRoles,
      ValidPermission.editRoles,
      ValidPermission.deleteRoles,
      ValidPermission.readDashboard,
    ],
  },

  // Rol 4: Visualizador de Incidencias
  {
    nameTemplate: 'Observador {subdomain}',
    description: 'Solo puede ver incidencias propias',
    permissions: [
      ValidPermission.viewOwnIncidents,
      ValidPermission.createComments,
      ValidPermission.editOwnComments,
      ValidPermission.deleteOwnComments,
      ValidPermission.readDashboard,
    ],
  },
];
