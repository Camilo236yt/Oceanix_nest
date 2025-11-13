import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import { Role } from 'src/roles/entities/role.entity';
import { RolePermission } from 'src/roles/entities/role-permission.entity';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/entities/user-role.entity';
import { ValidPermission } from 'src/auth/interfaces';
import * as bcrypt from 'bcrypt';

/**
 * Servicio para poblar la base de datos con datos iniciales
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Enterprise)
    private readonly enterpriseRepository: Repository<Enterprise>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  /**
   * Ejecuta todas las semillas
   */
  async runAllSeeds(): Promise<void> {
    this.logger.log('Starting database seeding...');

    // Primero crear los permisos globales
    const permissions = await this.seedPermissions();

    // Luego crear empresas con roles y usuarios
    await this.seedEnterprises(permissions);

    this.logger.log('Database seeding completed!');
  }

  /**
   * Pobla la tabla de permisos con la jerarquía del sistema de incidencias
   */
  async seedPermissions(): Promise<Map<string, Permission>> {
    this.logger.log('Seeding permissions...');

    // Verificar si ya existen permisos
    const existingCount = await this.permissionRepository.count();
    if (existingCount > 0) {
      this.logger.warn('Permissions already exist. Loading existing permissions...');
      const existingPermissions = await this.permissionRepository.find();
      const permissionsMap = new Map<string, Permission>();
      existingPermissions.forEach((p) => permissionsMap.set(p.name, p));
      return permissionsMap;
    }

    // Definir la estructura jerárquica de permisos
    const permissionsData = [
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
    ];

    // Crear permisos en dos fases para manejar las relaciones parent
    const createdPermissions = new Map<string, Permission>();

    // Fase 1: Crear todos los permisos sin parent
    for (const permData of permissionsData.filter((p) => !p.parent)) {
      const permission = this.permissionRepository.create({
        name: permData.name,
        title: permData.title,
        description: permData.description,
        isActive: true,
      });
      const saved = await this.permissionRepository.save(permission);
      createdPermissions.set(permData.name, saved);
      this.logger.log(`Created permission: ${permData.title}`);
    }

    // Fase 2: Crear permisos con parent
    for (const permData of permissionsData.filter((p) => p.parent)) {
      const parentPermission = createdPermissions.get(permData.parent);
      if (!parentPermission) {
        this.logger.error(
          `Parent permission not found for: ${permData.name} (parent: ${permData.parent})`,
        );
        continue;
      }

      const permission = this.permissionRepository.create({
        name: permData.name,
        title: permData.title,
        description: permData.description,
        isActive: true,
        parent: parentPermission,
      });
      const saved = await this.permissionRepository.save(permission);
      createdPermissions.set(permData.name, saved);
      this.logger.log(
        `Created permission: ${permData.title} (parent: ${parentPermission.title})`,
      );
    }

    this.logger.log(
      `Successfully seeded ${createdPermissions.size} permissions`,
    );

    return createdPermissions;
  }

  /**
   * Crea 3 empresas de prueba con roles y usuarios
   */
  async seedEnterprises(
    permissions: Map<string, Permission>,
  ): Promise<void> {
    this.logger.log('Seeding enterprises...');

    // Verificar si ya existen empresas
    const count = await this.enterpriseRepository.count();
    if (count > 0) {
      this.logger.warn('Enterprises already exist. Skipping seed...');
      return;
    }

    const enterprisesData = [
      {
        name: 'TechCorp Solutions',
        subdomain: 'techcorp',
        email: 'contact@techcorp.com',
        phone: '+1234567890',
      },
      {
        name: 'Global Services Inc',
        subdomain: 'globalservices',
        email: 'info@globalservices.com',
        phone: '+1234567891',
      },
      {
        name: 'Innovation Labs',
        subdomain: 'innovationlabs',
        email: 'hello@innovationlabs.com',
        phone: '+1234567892',
      },
    ];

    for (const enterpriseData of enterprisesData) {
      // Crear empresa
      const enterprise = this.enterpriseRepository.create({
        ...enterpriseData,
        isActive: true,
      });
      const savedEnterprise = await this.enterpriseRepository.save(enterprise);
      this.logger.log(`Created enterprise: ${savedEnterprise.name}`);

      // Crear 3 roles para esta empresa
      await this.seedRolesForEnterprise(savedEnterprise, permissions);

      // Crear 3 usuarios para esta empresa
      await this.seedUsersForEnterprise(savedEnterprise);
    }
  }

  /**
   * Crea 3 roles para una empresa específica
   */
  async seedRolesForEnterprise(
    enterprise: Enterprise,
    permissions: Map<string, Permission>,
  ): Promise<void> {
    this.logger.log(`Creating roles for enterprise: ${enterprise.name}`);

    // Rol 1: Administrador de Incidencias
    const incidentAdminRole = this.roleRepository.create({
      name: 'Administrador de Incidencias',
      description: 'Puede gestionar todas las incidencias del sistema',
      enterpriseId: enterprise.id,
      isActive: true,
      isSystemRole: false,
    });
    const savedIncidentAdminRole =
      await this.roleRepository.save(incidentAdminRole);

    // Asignar permisos de incidencias
    const incidentPermissions = [
      ValidPermission.manageIncidents,
      ValidPermission.createIncidents,
      ValidPermission.viewIncidents,
      ValidPermission.editIncidents,
      ValidPermission.deleteIncidents,
      ValidPermission.assignIncidents,
      ValidPermission.closeIncidents,
      ValidPermission.reopenIncidents,
      ValidPermission.readDashboard,
    ];

    for (const permName of incidentPermissions) {
      const permission = permissions.get(permName);
      if (permission) {
        const rolePermission = this.rolePermissionRepository.create({
          role: savedIncidentAdminRole,
          permission: permission,
        });
        await this.rolePermissionRepository.save(rolePermission);
      }
    }
    this.logger.log(
      `Created role: ${savedIncidentAdminRole.name} with ${incidentPermissions.length} permissions`,
    );

    // Rol 2: Administrador de Usuarios
    const userAdminRole = this.roleRepository.create({
      name: 'Administrador de Usuarios',
      description: 'Puede gestionar usuarios y roles del sistema',
      enterpriseId: enterprise.id,
      isActive: true,
      isSystemRole: false,
    });
    const savedUserAdminRole = await this.roleRepository.save(userAdminRole);

    // Asignar permisos de usuarios y roles
    const userPermissions = [
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
    ];

    for (const permName of userPermissions) {
      const permission = permissions.get(permName);
      if (permission) {
        const rolePermission = this.rolePermissionRepository.create({
          role: savedUserAdminRole,
          permission: permission,
        });
        await this.rolePermissionRepository.save(rolePermission);
      }
    }
    this.logger.log(
      `Created role: ${savedUserAdminRole.name} with ${userPermissions.length} permissions`,
    );

    // Rol 3: Visualizador de Incidencias
    const viewerRole = this.roleRepository.create({
      name: 'Visualizador de Incidencias',
      description: 'Solo puede ver incidencias propias',
      enterpriseId: enterprise.id,
      isActive: true,
      isSystemRole: false,
    });
    const savedViewerRole = await this.roleRepository.save(viewerRole);

    // Asignar permisos de solo lectura
    const viewerPermissions = [
      ValidPermission.viewOwnIncidents,
      ValidPermission.createComments,
      ValidPermission.editOwnComments,
      ValidPermission.deleteOwnComments,
      ValidPermission.readDashboard,
    ];

    for (const permName of viewerPermissions) {
      const permission = permissions.get(permName);
      if (permission) {
        const rolePermission = this.rolePermissionRepository.create({
          role: savedViewerRole,
          permission: permission,
        });
        await this.rolePermissionRepository.save(rolePermission);
      }
    }
    this.logger.log(
      `Created role: ${savedViewerRole.name} with ${viewerPermissions.length} permissions`,
    );
  }

  /**
   * Crea 3 usuarios para una empresa específica
   */
  async seedUsersForEnterprise(enterprise: Enterprise): Promise<void> {
    this.logger.log(`Creating users for enterprise: ${enterprise.name}`);

    // Obtener los roles de esta empresa
    const roles = await this.roleRepository.find({
      where: { enterpriseId: enterprise.id },
      order: { createdAt: 'ASC' },
    });

    if (roles.length !== 3) {
      this.logger.error(
        `Expected 3 roles for enterprise ${enterprise.name}, found ${roles.length}`,
      );
      return;
    }

    const [incidentAdminRole, userAdminRole, viewerRole] = roles;

    // Hashear la contraseña común para todos los usuarios
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Usuario 1: Admin de Incidencias
    const incidentAdmin = this.userRepository.create({
      name: 'Carlos',
      lastName: 'Rodríguez',
      email: `carlos.rodriguez@${enterprise.subdomain}.com`,
      password: hashedPassword,
      phoneNumber: '+1234567800',
      enterpriseId: enterprise.id,
      isActive: true,
      isEmailVerified: true,
      userType: 'EMPLOYEE',
    });
    const savedIncidentAdmin = await this.userRepository.save(incidentAdmin);

    // Asignar rol
    const incidentAdminUserRole = this.userRoleRepository.create({
      userId: savedIncidentAdmin.id,
      roleId: incidentAdminRole.id,
      enterpriseId: enterprise.id,
    });
    await this.userRoleRepository.save(incidentAdminUserRole);
    this.logger.log(
      `Created user: ${savedIncidentAdmin.email} with role: ${incidentAdminRole.name}`,
    );

    // Usuario 2: Admin de Usuarios
    const userAdmin = this.userRepository.create({
      name: 'María',
      lastName: 'González',
      email: `maria.gonzalez@${enterprise.subdomain}.com`,
      password: hashedPassword,
      phoneNumber: '+1234567801',
      enterpriseId: enterprise.id,
      isActive: true,
      isEmailVerified: true,
      userType: 'EMPLOYEE',
    });
    const savedUserAdmin = await this.userRepository.save(userAdmin);

    // Asignar rol
    const userAdminUserRole = this.userRoleRepository.create({
      userId: savedUserAdmin.id,
      roleId: userAdminRole.id,
      enterpriseId: enterprise.id,
    });
    await this.userRoleRepository.save(userAdminUserRole);
    this.logger.log(
      `Created user: ${savedUserAdmin.email} with role: ${userAdminRole.name}`,
    );

    // Usuario 3: Visualizador
    const viewer = this.userRepository.create({
      name: 'Juan',
      lastName: 'Pérez',
      email: `juan.perez@${enterprise.subdomain}.com`,
      password: hashedPassword,
      phoneNumber: '+1234567802',
      enterpriseId: enterprise.id,
      isActive: true,
      isEmailVerified: true,
      userType: 'EMPLOYEE',
    });
    const savedViewer = await this.userRepository.save(viewer);

    // Asignar rol
    const viewerUserRole = this.userRoleRepository.create({
      userId: savedViewer.id,
      roleId: viewerRole.id,
      enterpriseId: enterprise.id,
    });
    await this.userRoleRepository.save(viewerUserRole);
    this.logger.log(
      `Created user: ${savedViewer.email} with role: ${viewerRole.name}`,
    );
  }
}
