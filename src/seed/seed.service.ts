import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import { Role } from 'src/roles/entities/role.entity';
import { RolePermission } from 'src/roles/entities/role-permission.entity';
import { User, UserType } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/entities/user-role.entity';
import { Incidencia } from 'src/incidencias/entities/incidencia.entity';
import { TipoIncidencia, incidenciaStatus } from 'src/incidencias/dto/enum/status-incidencias.enum';
import { ValidPermission } from 'src/auth/interfaces';
import { EnterpriseConfig } from 'src/enterprise-config/entities/enterprise-config.entity';
import { EnterpriseDocument } from 'src/enterprise-config/entities/enterprise-document.entity';
import { VerificationStatus, DocumentType, DocumentStatus } from 'src/enterprise-config/enums/verification-status.enum';
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
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
    @InjectRepository(EnterpriseConfig)
    private readonly enterpriseConfigRepository: Repository<EnterpriseConfig>,
    @InjectRepository(EnterpriseDocument)
    private readonly enterpriseDocumentRepository: Repository<EnterpriseDocument>,
  ) {}

  /**
   * Ejecuta todas las semillas
   */
  async runAllSeeds(): Promise<void> {
    this.logger.log('Starting database seeding...');

    // Primero limpiar toda la base de datos
    await this.cleanDatabase();

    // Crear los permisos globales
    const permissions = await this.seedPermissions();

    // Crear usuario SUPER_ADMIN del sistema (sin empresa)
    await this.seedSuperAdmin();

    // Crear empresas con roles y usuarios
    await this.seedEnterprises(permissions);

    // Crear incidencias de prueba para cada empresa
    await this.seedIncidencias();

    // Crear configuraciones y documentos de empresas
    await this.seedEnterpriseConfigs();
    await this.seedEnterpriseDocuments();

    this.logger.log('Database seeding completed!');
  }

  /**
   * Limpia toda la base de datos en el orden correcto
   * (respetando las foreign keys)
   */
  async cleanDatabase(): Promise<void> {
    this.logger.log('🧹 Cleaning database...');

    try {
      // 1. Eliminar documentos de empresas (dependen de enterprises)
      this.logger.log('Deleting enterprise documents...');
      await this.enterpriseDocumentRepository.query('DELETE FROM enterprise_documents');

      // 2. Eliminar configuraciones de empresas (dependen de enterprises)
      this.logger.log('Deleting enterprise configs...');
      await this.enterpriseConfigRepository.query('DELETE FROM enterprise_config');

      // 3. Eliminar incidencias (no tienen foreign keys que las referencien)
      this.logger.log('Deleting incidencias...');
      await this.incidenciaRepository.query('DELETE FROM incidencias');

      // 4. Eliminar relaciones user-role
      this.logger.log('Deleting user-role relationships...');
      await this.userRoleRepository.query('DELETE FROM user_roles');

      // 5. Eliminar usuarios (excepto SUPER_ADMIN si existe)
      this.logger.log('Deleting users...');
      await this.userRepository.query('DELETE FROM users WHERE "userType" != \'SUPER_ADMIN\'');

      // 6. Eliminar relaciones role-permission
      this.logger.log('Deleting role-permission relationships...');
      await this.rolePermissionRepository.query('DELETE FROM role_permission');

      // 7. Eliminar roles
      this.logger.log('Deleting roles...');
      await this.roleRepository.query('DELETE FROM roles');

      // 8. Eliminar permisos
      this.logger.log('Deleting permissions...');
      await this.permissionRepository.query('DELETE FROM permissions');

      // 9. Eliminar empresas
      this.logger.log('Deleting enterprises...');
      await this.enterpriseRepository.query('DELETE FROM enterprises');

      this.logger.log('✅ Database cleaned successfully!');
    } catch (error) {
      this.logger.error('Error cleaning database:', error.message);
      throw error;
    }
  }

  /**
   * Crea el usuario SUPER_ADMIN del sistema (sin empresa)
   * Este usuario tiene acceso global para gestionar todas las empresas
   */
  async seedSuperAdmin(): Promise<void> {
    this.logger.log('Creating SUPER_ADMIN user...');

    // Verificar si ya existe un SUPER_ADMIN
    const existingSuperAdmin = await this.userRepository.findOne({
      where: { userType: UserType.SUPER_ADMIN },
    });

    if (existingSuperAdmin) {
      this.logger.warn('SUPER_ADMIN already exists. Skipping...');
      return;
    }

    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);

    const superAdmin = this.userRepository.create({
      name: 'Super',
      lastName: 'Admin',
      email: 'superadmin@oceanix.space',
      password: hashedPassword,
      phoneNumber: '+1000000000',
      enterpriseId: undefined as unknown as string, // Sin empresa - acceso global (null en BD)
      isActive: true,
      isEmailVerified: true,
      userType: UserType.SUPER_ADMIN,
      isLegalRepresentative: false,
    });

    await this.userRepository.save(superAdmin);
    this.logger.log(`✅ Created SUPER_ADMIN: ${superAdmin.email} (NO enterprise - global access)`);
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
      if (!permData.parent) {
        continue;
      }
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

      // Crear 4 roles para esta empresa
      await this.seedRolesForEnterprise(savedEnterprise, permissions);

      // Crear 4 usuarios para esta empresa
      await this.seedUsersForEnterprise(savedEnterprise);
    }
  }

  /**
   * Crea 4 roles para una empresa específica
   */
  async seedRolesForEnterprise(
    enterprise: Enterprise,
    permissions: Map<string, Permission>,
  ): Promise<void> {
    this.logger.log(`Creating roles for enterprise: ${enterprise.name}`);

    // Rol 1: Super Admin (TODOS los permisos)
    const superAdminRole = this.roleRepository.create({
      name: `Administrador ${enterprise.subdomain}`,
      description: 'Administrator with full access to all system features',
      enterpriseId: enterprise.id,
      isActive: true,
      isSystemRole: false,
    });
    const savedSuperAdminRole = await this.roleRepository.save(superAdminRole);

    // Asignar TODOS los permisos
    let superAdminPermCount = 0;
    for (const permission of permissions.values()) {
      const rolePermission = this.rolePermissionRepository.create({
        role: savedSuperAdminRole,
        permission: permission,
      });
      await this.rolePermissionRepository.save(rolePermission);
      superAdminPermCount++;
    }
    this.logger.log(
      `Created role: ${savedSuperAdminRole.name} with ${superAdminPermCount} permissions (ALL PERMISSIONS)`,
    );

    // Rol 2: Administrador de Incidencias
    const incidentAdminRole = this.roleRepository.create({
      name: `Gestor de Incidencias ${enterprise.subdomain}`,
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

    // Rol 3: Administrador de Usuarios
    const userAdminRole = this.roleRepository.create({
      name: `Gestor de Usuarios ${enterprise.subdomain}`,
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

    // Rol 4: Visualizador de Incidencias
    const viewerRole = this.roleRepository.create({
      name: `Observador ${enterprise.subdomain}`,
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
   * Crea 4 usuarios para una empresa específica
   */
  async seedUsersForEnterprise(enterprise: Enterprise): Promise<void> {
    this.logger.log(`Creating users for enterprise: ${enterprise.name}`);

    // Obtener los roles de esta empresa
    const roles = await this.roleRepository.find({
      where: { enterpriseId: enterprise.id },
      order: { createdAt: 'ASC' },
    });

    if (roles.length !== 4) {
      this.logger.error(
        `Expected 4 roles for enterprise ${enterprise.name}, found ${roles.length}`,
      );
      return;
    }

    const [superAdminRole, incidentAdminRole, userAdminRole, viewerRole] = roles;

    // Hashear la contraseña común para todos los usuarios
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Usuario 1: Super Admin (TODOS los permisos)
    const superAdmin = this.userRepository.create({
      name: 'Admin',
      lastName: 'Super',
      email: `admin.super@${enterprise.subdomain}.com`,
      password: hashedPassword,
      phoneNumber: '+1234567799',
      enterpriseId: enterprise.id,
      isActive: true,
      isEmailVerified: true,
      userType: UserType.EMPLOYEE,
    });
    const savedSuperAdmin = await this.userRepository.save(superAdmin);

    // Asignar rol Super Admin
    const superAdminUserRole = this.userRoleRepository.create({
      userId: savedSuperAdmin.id,
      roleId: superAdminRole.id,
      enterpriseId: enterprise.id,
    });
    await this.userRoleRepository.save(superAdminUserRole);
    this.logger.log(
      `Created user: ${savedSuperAdmin.email} with role: ${superAdminRole.name} (ALL PERMISSIONS)`,
    );

    // Usuario 2: Admin de Incidencias
    const incidentAdmin = this.userRepository.create({
      name: 'Carlos',
      lastName: 'Rodríguez',
      email: `carlos.rodriguez@${enterprise.subdomain}.com`,
      password: hashedPassword,
      phoneNumber: '+1234567800',
      enterpriseId: enterprise.id,
      isActive: true,
      isEmailVerified: true,
      userType: UserType.EMPLOYEE,
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
      userType: UserType.EMPLOYEE,
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
      userType: UserType.EMPLOYEE,
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

  /**
   * Crea incidencias de prueba para todas las empresas
   */
  async seedIncidencias(): Promise<void> {
    this.logger.log('Seeding incidencias...');

    // Obtener todas las empresas
    const enterprises = await this.enterpriseRepository.find();

    if (enterprises.length === 0) {
      this.logger.warn('No enterprises found. Skipping incidencias seed...');
      return;
    }

    let totalCreated = 0;

    for (const enterprise of enterprises) {
      this.logger.log(`Creating incidencias for enterprise: ${enterprise.name}`);

      // Crear incidencias variadas para generar datos realistas para el reporte
      const incidenciasData = [
        // Pérdidas (45 total distribuidas)
        ...this.generateIncidenciasForType(
          TipoIncidencia.POR_PERDIDA,
          15,
          enterprise.id,
          'Pérdida',
        ),

        // Daños (27 total distribuidas)
        ...this.generateIncidenciasForType(
          TipoIncidencia.POR_DANO,
          9,
          enterprise.id,
          'Daño',
        ),

        // Retrasos (30 total - agrupando tipos técnicos/operativos)
        ...this.generateIncidenciasForType(
          TipoIncidencia.POR_ERROR_HUMANO,
          5,
          enterprise.id,
          'Error Humano',
        ),
        ...this.generateIncidenciasForType(
          TipoIncidencia.POR_MANTENIMIENTO,
          3,
          enterprise.id,
          'Mantenimiento',
        ),
        ...this.generateIncidenciasForType(
          TipoIncidencia.POR_FALLA_TECNICA,
          2,
          enterprise.id,
          'Falla Técnica',
        ),

        // Otros (18 total distribuidas)
        ...this.generateIncidenciasForType(
          TipoIncidencia.OTRO,
          6,
          enterprise.id,
          'Otros',
        ),
      ];

      // Guardar todas las incidencias
      for (const incData of incidenciasData) {
        const incidencia = this.incidenciaRepository.create(incData);
        await this.incidenciaRepository.save(incidencia);
        totalCreated++;
      }

      this.logger.log(
        `Created ${incidenciasData.length} incidencias for ${enterprise.name}`,
      );
    }

    this.logger.log(`✅ Successfully seeded ${totalCreated} incidencias in total`);
  }

  /**
   * Genera datos de incidencias para un tipo específico
   */
  private generateIncidenciasForType(
    tipo: TipoIncidencia,
    count: number,
    enterpriseId: string,
    prefix: string,
  ): Partial<Incidencia>[] {
    const incidencias: Partial<Incidencia>[] = [];
    const statuses = [
      incidenciaStatus.RESOLVED,
      incidenciaStatus.PENDING,
      incidenciaStatus.IN_PROGRESS,
      incidenciaStatus.CLOSED,
    ];

    // Distribución de estados según el dashboard:
    // Resueltas: 65%, Pendientes: 28%, Críticas (IN_PROGRESS): 10%
    const statusDistribution = [
      ...Array(Math.ceil(count * 0.65)).fill(incidenciaStatus.RESOLVED),
      ...Array(Math.ceil(count * 0.20)).fill(incidenciaStatus.PENDING),
      ...Array(Math.ceil(count * 0.10)).fill(incidenciaStatus.IN_PROGRESS),
      ...Array(Math.ceil(count * 0.05)).fill(incidenciaStatus.CLOSED),
    ];

    for (let i = 0; i < count; i++) {
      const status = statusDistribution[i] || statuses[i % statuses.length];

      // Generar fechas realistas (últimos 11 meses)
      const createdDate = this.getRandomDateInRange(
        new Date('2025-01-01'),
        new Date('2025-11-30'),
      );

      // Si está resuelta, agregar tiempo de resolución
      const updatedDate =
        status === incidenciaStatus.RESOLVED || status === incidenciaStatus.CLOSED
          ? this.addDaysToDate(createdDate, Math.floor(Math.random() * 5) + 1) // 1-5 días
          : new Date();

      incidencias.push({
        tipo,
        name: `${prefix} #${i + 1} - ${enterpriseId.substring(0, 8)}`,
        description: `Descripción detallada de ${prefix.toLowerCase()} ${i + 1} para la empresa`,
        status: status,
        ProducReferenceId: `PROD-${enterpriseId.substring(0, 4)}-${tipo}-${Date.now()}-${i}`,
        tenantId: enterpriseId,
        isActive: true,
        createdAt: createdDate,
        updatedAt: updatedDate,
      });
    }

    return incidencias;
  }

  /**
   * Genera una fecha aleatoria dentro de un rango
   */
  private getRandomDateInRange(start: Date, end: Date): Date {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );
  }

  /**
   * Agrega días a una fecha
   */
  private addDaysToDate(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Crea configuraciones para las empresas
   */
  async seedEnterpriseConfigs(): Promise<void> {
    this.logger.log('Seeding enterprise configs...');

    const enterprises = await this.enterpriseRepository.find();

    if (enterprises.length === 0) {
      this.logger.warn('No enterprises found. Skipping configs seed...');
      return;
    }

    const configs = [
      // TechCorp - Verificada
      {
        enterpriseId: enterprises[0].id,
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        verificationDate: new Date('2025-01-15'),
        primaryColor: '#2563EB',
        secondaryColor: '#1E40AF',
        accentColor: '#F59E0B',
        emailDomains: ['techcorp.com', 'tc.com'],
        requireCorporateEmail: false,
      },
      // Global Services - Pendiente
      {
        enterpriseId: enterprises[1].id,
        isVerified: false,
        verificationStatus: VerificationStatus.PENDING,
        primaryColor: '#10B981',
        secondaryColor: '#059669',
        accentColor: '#8B5CF6',
        emailDomains: ['globalservices.com'],
        requireCorporateEmail: true,
      },
      // Innovation Labs - Rechazada
      {
        enterpriseId: enterprises[2].id,
        isVerified: false,
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: 'Tax ID document is expired. Please upload updated documentation.',
        verificationDate: new Date('2025-02-10'),
        primaryColor: '#EF4444',
        secondaryColor: '#DC2626',
        accentColor: '#F97316',
        emailDomains: ['innovationlabs.com', 'ilabs.io'],
        requireCorporateEmail: false,
      },
    ];

    for (const configData of configs) {
      const config = this.enterpriseConfigRepository.create(configData);
      await this.enterpriseConfigRepository.save(config);
      this.logger.log(
        `Created config for enterprise: ${enterprises.find((e) => e.id === configData.enterpriseId)?.name} (Status: ${configData.verificationStatus})`,
      );
    }

    this.logger.log('✅ Successfully seeded enterprise configs');
  }

  /**
   * Crea documentos de prueba para las empresas
   */
  async seedEnterpriseDocuments(): Promise<void> {
    this.logger.log('Seeding enterprise documents...');

    const enterprises = await this.enterpriseRepository.find();

    if (enterprises.length === 0) {
      this.logger.warn('No enterprises found. Skipping documents seed...');
      return;
    }

    const documents = [
      // TechCorp - Todos aprobados
      {
        enterpriseId: enterprises[0].id,
        type: DocumentType.TAX_ID,
        fileName: 'techcorp_rut_2025.pdf',
        fileKey: 'enterprises/techcorp/documents/tax_id.pdf',
        fileUrl: 'https://example.com/docs/techcorp_tax_id.pdf',
        mimeType: 'application/pdf',
        fileSize: 245632,
        description: 'RUT vigente 2025',
        status: DocumentStatus.APPROVED,
        approvalDate: new Date('2025-01-12'),
        version: 1,
      },
      {
        enterpriseId: enterprises[0].id,
        type: DocumentType.CHAMBER_COMMERCE,
        fileName: 'techcorp_chamber_commerce.pdf',
        fileKey: 'enterprises/techcorp/documents/chamber.pdf',
        fileUrl: 'https://example.com/docs/techcorp_chamber.pdf',
        mimeType: 'application/pdf',
        fileSize: 189456,
        description: 'Certificado Cámara de Comercio',
        status: DocumentStatus.APPROVED,
        approvalDate: new Date('2025-01-13'),
        version: 1,
      },
      {
        enterpriseId: enterprises[0].id,
        type: DocumentType.LEGAL_REP_ID,
        fileName: 'techcorp_legal_rep_id.pdf',
        fileKey: 'enterprises/techcorp/documents/legal_rep.pdf',
        fileUrl: 'https://example.com/docs/techcorp_legal_rep.pdf',
        mimeType: 'application/pdf',
        fileSize: 156234,
        description: 'Cédula representante legal',
        status: DocumentStatus.APPROVED,
        approvalDate: new Date('2025-01-14'),
        version: 1,
      },

      // Global Services - Pendientes
      {
        enterpriseId: enterprises[1].id,
        type: DocumentType.TAX_ID,
        fileName: 'globalservices_rut.pdf',
        fileKey: 'enterprises/globalservices/documents/tax_id.pdf',
        fileUrl: 'https://example.com/docs/globalservices_tax.pdf',
        mimeType: 'application/pdf',
        fileSize: 234567,
        description: 'RUT de la empresa',
        status: DocumentStatus.PENDING,
        version: 1,
      },
      {
        enterpriseId: enterprises[1].id,
        type: DocumentType.CHAMBER_COMMERCE,
        fileName: 'globalservices_chamber.pdf',
        fileKey: 'enterprises/globalservices/documents/chamber.pdf',
        fileUrl: 'https://example.com/docs/globalservices_chamber.pdf',
        mimeType: 'application/pdf',
        fileSize: 198765,
        description: 'Certificado Cámara de Comercio',
        status: DocumentStatus.PENDING,
        version: 1,
      },

      // Innovation Labs - Uno rechazado, otros pendientes
      {
        enterpriseId: enterprises[2].id,
        type: DocumentType.TAX_ID,
        fileName: 'innovationlabs_rut_expired.pdf',
        fileKey: 'enterprises/innovationlabs/documents/tax_id_old.pdf',
        fileUrl: 'https://example.com/docs/innovationlabs_tax_old.pdf',
        mimeType: 'application/pdf',
        fileSize: 267890,
        description: 'RUT - versión anterior',
        status: DocumentStatus.REJECTED,
        rejectionReason: 'Documento vencido. Fecha de expedición: 2023-01-01. Por favor suba versión actualizada.',
        approvalDate: new Date('2025-02-10'),
        version: 1,
      },
      {
        enterpriseId: enterprises[2].id,
        type: DocumentType.LEGAL_REP_ID,
        fileName: 'innovationlabs_legal_rep.pdf',
        fileKey: 'enterprises/innovationlabs/documents/legal_rep.pdf',
        fileUrl: 'https://example.com/docs/innovationlabs_legal.pdf',
        mimeType: 'application/pdf',
        fileSize: 145678,
        description: 'Cédula del representante legal',
        status: DocumentStatus.PENDING,
        version: 1,
      },
    ];

    for (const docData of documents) {
      const document = this.enterpriseDocumentRepository.create(docData);
      await this.enterpriseDocumentRepository.save(document);
      this.logger.log(
        `Created document: ${docData.type} for ${enterprises.find((e) => e.id === docData.enterpriseId)?.name} (Status: ${docData.status})`,
      );
    }

    this.logger.log('✅ Successfully seeded enterprise documents');
  }
}
