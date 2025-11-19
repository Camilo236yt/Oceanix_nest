import { ValidPermission } from '../../auth/interfaces';

/**
 * Definición de todos los permisos del sistema con su jerarquía
 */
export interface PermissionData {
  name: ValidPermission;
  title: string;
  description: string;
  parent?: ValidPermission;
}

export const PERMISSIONS_DATA: PermissionData[] = [
  // Dashboard (sin parent)
  {
    name: ValidPermission.readDashboard,
    title: 'Ver Dashboard',
    description: 'Permite acceder al dashboard principal del sistema',
  },
  {
    name: ValidPermission.viewReports,
    title: 'Ver Reportes',
    description: 'Permite visualizar reportes y estadísticas',
  },
  {
    name: ValidPermission.exportReports,
    title: 'Exportar Reportes',
    description: 'Permite exportar reportes a diferentes formatos',
  },

  // Gestión de Incidencias (con parent manageIncidents)
  {
    name: ValidPermission.manageIncidents,
    title: 'Gestionar Incidencias',
    description: 'Permiso principal para la gestión completa de incidencias',
  },
  {
    name: ValidPermission.createIncidents,
    title: 'Crear Incidencias',
    description: 'Permite crear nuevas incidencias',
    parent: ValidPermission.manageIncidents,
  },
  {
    name: ValidPermission.viewIncidents,
    title: 'Ver Todas las Incidencias',
    description: 'Permite ver todas las incidencias del sistema',
    parent: ValidPermission.manageIncidents,
  },
  {
    name: ValidPermission.viewOwnIncidents,
    title: 'Ver Incidencias Propias',
    description: 'Permite ver solo las incidencias creadas por el usuario',
    parent: ValidPermission.manageIncidents,
  },
  {
    name: ValidPermission.editIncidents,
    title: 'Editar Incidencias',
    description: 'Permite editar cualquier incidencia',
    parent: ValidPermission.manageIncidents,
  },
  {
    name: ValidPermission.editOwnIncidents,
    title: 'Editar Incidencias Propias',
    description: 'Permite editar solo las incidencias creadas por el usuario',
    parent: ValidPermission.manageIncidents,
  },
  {
    name: ValidPermission.deleteIncidents,
    title: 'Eliminar Incidencias',
    description: 'Permite eliminar incidencias',
    parent: ValidPermission.manageIncidents,
  },
  {
    name: ValidPermission.assignIncidents,
    title: 'Asignar Incidencias',
    description: 'Permite asignar incidencias a otros usuarios',
    parent: ValidPermission.manageIncidents,
  },
  {
    name: ValidPermission.closeIncidents,
    title: 'Cerrar Incidencias',
    description: 'Permite marcar incidencias como cerradas',
    parent: ValidPermission.manageIncidents,
  },
  {
    name: ValidPermission.reopenIncidents,
    title: 'Reabrir Incidencias',
    description: 'Permite reabrir incidencias cerradas',
    parent: ValidPermission.manageIncidents,
  },

  // Categorías de Incidencias
  {
    name: ValidPermission.manageCategories,
    title: 'Gestionar Categorías',
    description: 'Permiso principal para gestión de categorías',
  },
  {
    name: ValidPermission.createCategories,
    title: 'Crear Categorías',
    description: 'Permite crear nuevas categorías',
    parent: ValidPermission.manageCategories,
  },
  {
    name: ValidPermission.editCategories,
    title: 'Editar Categorías',
    description: 'Permite editar categorías existentes',
    parent: ValidPermission.manageCategories,
  },
  {
    name: ValidPermission.deleteCategories,
    title: 'Eliminar Categorías',
    description: 'Permite eliminar categorías',
    parent: ValidPermission.manageCategories,
  },

  // Prioridades de Incidencias
  {
    name: ValidPermission.managePriorities,
    title: 'Gestionar Prioridades',
    description: 'Permiso principal para gestión de prioridades',
  },
  {
    name: ValidPermission.createPriorities,
    title: 'Crear Prioridades',
    description: 'Permite crear nuevas prioridades',
    parent: ValidPermission.managePriorities,
  },
  {
    name: ValidPermission.editPriorities,
    title: 'Editar Prioridades',
    description: 'Permite editar prioridades existentes',
    parent: ValidPermission.managePriorities,
  },
  {
    name: ValidPermission.deletePriorities,
    title: 'Eliminar Prioridades',
    description: 'Permite eliminar prioridades',
    parent: ValidPermission.managePriorities,
  },

  // Estados de Incidencias
  {
    name: ValidPermission.manageStatuses,
    title: 'Gestionar Estados',
    description: 'Permiso principal para gestión de estados',
  },
  {
    name: ValidPermission.createStatuses,
    title: 'Crear Estados',
    description: 'Permite crear nuevos estados',
    parent: ValidPermission.manageStatuses,
  },
  {
    name: ValidPermission.editStatuses,
    title: 'Editar Estados',
    description: 'Permite editar estados existentes',
    parent: ValidPermission.manageStatuses,
  },
  {
    name: ValidPermission.deleteStatuses,
    title: 'Eliminar Estados',
    description: 'Permite eliminar estados',
    parent: ValidPermission.manageStatuses,
  },

  // Comentarios
  {
    name: ValidPermission.manageComments,
    title: 'Gestionar Comentarios',
    description: 'Permiso principal para gestión de comentarios',
  },
  {
    name: ValidPermission.createComments,
    title: 'Crear Comentarios',
    description: 'Permite crear comentarios en incidencias',
    parent: ValidPermission.manageComments,
  },
  {
    name: ValidPermission.editComments,
    title: 'Editar Comentarios',
    description: 'Permite editar cualquier comentario',
    parent: ValidPermission.manageComments,
  },
  {
    name: ValidPermission.editOwnComments,
    title: 'Editar Comentarios Propios',
    description: 'Permite editar solo los comentarios propios',
    parent: ValidPermission.manageComments,
  },
  {
    name: ValidPermission.deleteComments,
    title: 'Eliminar Comentarios',
    description: 'Permite eliminar cualquier comentario',
    parent: ValidPermission.manageComments,
  },
  {
    name: ValidPermission.deleteOwnComments,
    title: 'Eliminar Comentarios Propios',
    description: 'Permite eliminar solo los comentarios propios',
    parent: ValidPermission.manageComments,
  },

  // Archivos/Adjuntos
  {
    name: ValidPermission.manageFiles,
    title: 'Gestionar Archivos',
    description: 'Permiso principal para gestión de archivos',
  },
  {
    name: ValidPermission.uploadFiles,
    title: 'Subir Archivos',
    description: 'Permite subir archivos adjuntos',
    parent: ValidPermission.manageFiles,
  },
  {
    name: ValidPermission.downloadFiles,
    title: 'Descargar Archivos',
    description: 'Permite descargar archivos adjuntos',
    parent: ValidPermission.manageFiles,
  },
  {
    name: ValidPermission.deleteFiles,
    title: 'Eliminar Archivos',
    description: 'Permite eliminar archivos adjuntos',
    parent: ValidPermission.manageFiles,
  },

  // Gestión de Usuarios/Empleados
  {
    name: ValidPermission.manageUsers,
    title: 'Gestionar Usuarios',
    description: 'Permiso principal para gestión de usuarios',
  },
  {
    name: ValidPermission.createUsers,
    title: 'Crear Usuarios',
    description: 'Permite crear nuevos usuarios',
    parent: ValidPermission.manageUsers,
  },
  {
    name: ValidPermission.viewUsers,
    title: 'Ver Usuarios',
    description: 'Permite ver lista de usuarios',
    parent: ValidPermission.manageUsers,
  },
  {
    name: ValidPermission.editUsers,
    title: 'Editar Usuarios',
    description: 'Permite editar información de usuarios',
    parent: ValidPermission.manageUsers,
  },
  {
    name: ValidPermission.deleteUsers,
    title: 'Eliminar Usuarios',
    description: 'Permite eliminar usuarios',
    parent: ValidPermission.manageUsers,
  },

  // Roles y Permisos
  {
    name: ValidPermission.manageRoles,
    title: 'Gestionar Roles',
    description: 'Permiso principal para gestión de roles',
  },
  {
    name: ValidPermission.getRoles,
    title: 'Ver Roles',
    description: 'Permite ver lista de roles',
    parent: ValidPermission.manageRoles,
  },
  {
    name: ValidPermission.createRoles,
    title: 'Crear Roles',
    description: 'Permite crear nuevos roles',
    parent: ValidPermission.manageRoles,
  },
  {
    name: ValidPermission.editRoles,
    title: 'Editar Roles',
    description: 'Permite editar roles existentes',
    parent: ValidPermission.manageRoles,
  },
  {
    name: ValidPermission.deleteRoles,
    title: 'Eliminar Roles',
    description: 'Permite eliminar roles',
    parent: ValidPermission.manageRoles,
  },
  {
    name: ValidPermission.managePermissions,
    title: 'Gestionar Permisos',
    description: 'Permite administrar permisos del sistema',
  },

  // Notificaciones
  {
    name: ValidPermission.manageNotifications,
    title: 'Gestionar Notificaciones',
    description: 'Permiso principal para gestión de notificaciones',
  },
  {
    name: ValidPermission.sendNotifications,
    title: 'Enviar Notificaciones',
    description: 'Permite enviar notificaciones a usuarios',
    parent: ValidPermission.manageNotifications,
  },

  // Email
  {
    name: ValidPermission.manageEmailQueue,
    title: 'Gestionar Cola de Emails',
    description: 'Permite administrar la cola de emails',
  },
  {
    name: ValidPermission.manageEmailVerification,
    title: 'Gestionar Verificación de Email',
    description: 'Permite administrar la verificación de emails',
  },

  // Administración del Sistema
  {
    name: ValidPermission.manageRedis,
    title: 'Gestionar Redis',
    description: 'Permite administrar caché Redis',
  },
  {
    name: ValidPermission.manageSystem,
    title: 'Gestionar Sistema',
    description: 'Permite administrar configuración del sistema',
  },

  // Enterprise Configuration & Verification
  {
    name: ValidPermission.manageEnterpriseConfig,
    title: 'Gestionar Configuración de Empresa',
    description: 'Permite configurar colores, logos y dominios de email de la empresa',
  },
  {
    name: ValidPermission.uploadEnterpriseDocuments,
    title: 'Subir Documentos de Empresa',
    description: 'Permite subir documentos legales de la empresa',
  },
  {
    name: ValidPermission.verifyEnterprises,
    title: 'Verificar Empresas',
    description: 'Permite verificar o rechazar empresas (solo SUPER_ADMIN)',
  },
  {
    name: ValidPermission.approveDocuments,
    title: 'Aprobar Documentos',
    description: 'Permite aprobar o rechazar documentos de empresas (solo SUPER_ADMIN)',
  },
];
