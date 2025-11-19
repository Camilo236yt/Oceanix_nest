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
import { incidenciaStatus, TipoIncidencia } from 'src/incidencias/dto/enum/status-incidencias.enum';
import { EnterpriseConfig } from 'src/enterprise-config/entities/enterprise-config.entity';
import { EnterpriseDocument } from 'src/enterprise-config/entities/enterprise-document.entity';
import * as bcrypt from 'bcrypt';

// Importar datos desde archivos separados
import {
  PERMISSIONS_DATA,
  ENTERPRISES_DATA,
  ROLES_DATA,
  USERS_DATA,
  SUPER_ADMIN_DATA,
  DEFAULT_USER_PASSWORD,
  INCIDENCIAS_CONFIG,
  DATE_RANGE,
  RESOLUTION_DAYS,
  getStatusDistribution,
  ENTERPRISE_CONFIGS_DATA,
  ENTERPRISE_DOCUMENTS_DATA,
} from './data';

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

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_DATA.password, 10);

    const superAdmin = this.userRepository.create({
      name: SUPER_ADMIN_DATA.name,
      lastName: SUPER_ADMIN_DATA.lastName,
      email: SUPER_ADMIN_DATA.email,
      password: hashedPassword,
      phoneNumber: SUPER_ADMIN_DATA.phoneNumber,
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

    // Usar datos importados desde archivo
    const permissionsData = PERMISSIONS_DATA;

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

    // Usar datos importados desde archivo
    for (const enterpriseData of ENTERPRISES_DATA) {
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
   * Crea 4 roles para una empresa específica usando datos del archivo
   */
  async seedRolesForEnterprise(
    enterprise: Enterprise,
    permissions: Map<string, Permission>,
  ): Promise<void> {
    this.logger.log(`Creating roles for enterprise: ${enterprise.name}`);

    // Usar datos importados desde archivo
    for (const roleData of ROLES_DATA) {
      // Reemplazar {subdomain} en el template del nombre
      const roleName = roleData.nameTemplate.replace('{subdomain}', enterprise.subdomain);

      // Crear rol
      const role = this.roleRepository.create({
        name: roleName,
        description: roleData.description,
        enterpriseId: enterprise.id,
        isActive: true,
        isSystemRole: false,
      });
      const savedRole = await this.roleRepository.save(role);

      // Asignar permisos
      let permCount = 0;

      // Si no hay permisos específicos, asignar TODOS (rol Super Admin)
      if (roleData.permissions.length === 0) {
        for (const permission of permissions.values()) {
          const rolePermission = this.rolePermissionRepository.create({
            role: savedRole,
            permission: permission,
          });
          await this.rolePermissionRepository.save(rolePermission);
          permCount++;
        }
        this.logger.log(
          `Created role: ${savedRole.name} with ${permCount} permissions (ALL PERMISSIONS)`,
        );
      } else {
        // Asignar permisos específicos del rol
        for (const permName of roleData.permissions) {
          const permission = permissions.get(permName);
          if (permission) {
            const rolePermission = this.rolePermissionRepository.create({
              role: savedRole,
              permission: permission,
            });
            await this.rolePermissionRepository.save(rolePermission);
            permCount++;
          }
        }
        this.logger.log(
          `Created role: ${savedRole.name} with ${permCount} permissions`,
        );
      }
    }
  }

  /**
   * Crea 4 usuarios para una empresa específica usando datos del archivo
   */
  async seedUsersForEnterprise(enterprise: Enterprise): Promise<void> {
    this.logger.log(`Creating users for enterprise: ${enterprise.name}`);

    // Obtener los roles de esta empresa
    const roles = await this.roleRepository.find({
      where: { enterpriseId: enterprise.id },
      order: { createdAt: 'ASC' },
    });

    if (roles.length !== USERS_DATA.length) {
      this.logger.error(
        `Expected ${USERS_DATA.length} roles for enterprise ${enterprise.name}, found ${roles.length}`,
      );
      return;
    }

    // Hashear la contraseña común para todos los usuarios (usar dato del archivo)
    const hashedPassword = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10);

    // Usar datos importados desde archivo
    for (const userData of USERS_DATA) {
      // Crear usuario
      const user = this.userRepository.create({
        name: userData.name,
        lastName: userData.lastName,
        email: `${userData.emailPrefix}@${enterprise.subdomain}.com`,
        password: hashedPassword,
        phoneNumber: userData.phoneNumber,
        enterpriseId: enterprise.id,
        isActive: true,
        isEmailVerified: true,
        userType: UserType.EMPLOYEE,
      });
      const savedUser = await this.userRepository.save(user);

      // Asignar rol correspondiente al usuario
      const role = roles[userData.roleIndex];
      const userRole = this.userRoleRepository.create({
        userId: savedUser.id,
        roleId: role.id,
        enterpriseId: enterprise.id,
      });
      await this.userRoleRepository.save(userRole);

      this.logger.log(
        `Created user: ${savedUser.email} with role: ${role.name}`,
      );
    }
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

      // Usar configuración importada desde archivo
      const incidenciasData: Partial<Incidencia>[] = [];
      for (const config of INCIDENCIAS_CONFIG) {
        incidenciasData.push(
          ...this.generateIncidenciasForType(
            config.tipo,
            config.count,
            enterprise.id,
            config.prefix,
          ),
        );
      }

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

    // Usar distribución de estados importada desde archivo
    const statusDistribution = getStatusDistribution(count);

    for (let i = 0; i < count; i++) {
      const status = statusDistribution[i] || incidenciaStatus.PENDING;

      // Generar fechas realistas usando rangos del archivo
      const createdDate = this.getRandomDateInRange(
        DATE_RANGE.start,
        DATE_RANGE.end,
      );

      // Si está resuelta, agregar tiempo de resolución usando datos del archivo
      const updatedDate =
        status === incidenciaStatus.RESOLVED || status === incidenciaStatus.CLOSED
          ? this.addDaysToDate(
              createdDate,
              Math.floor(Math.random() * (RESOLUTION_DAYS.max - RESOLUTION_DAYS.min + 1)) +
                RESOLUTION_DAYS.min,
            )
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

    // Usar datos importados desde archivo
    for (let i = 0; i < ENTERPRISE_CONFIGS_DATA.length && i < enterprises.length; i++) {
      const configData = ENTERPRISE_CONFIGS_DATA[i];
      const enterprise = enterprises[i];

      const config = this.enterpriseConfigRepository.create({
        ...configData,
        enterpriseId: enterprise.id,
      });
      await this.enterpriseConfigRepository.save(config);

      this.logger.log(
        `Created config for enterprise: ${enterprise.name} (Status: ${configData.verificationStatus})`,
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

    // Usar datos importados desde archivo
    for (const docData of ENTERPRISE_DOCUMENTS_DATA) {
      const enterprise = enterprises[docData.enterpriseIndex];
      if (!enterprise) {
        this.logger.warn(`Enterprise not found at index ${docData.enterpriseIndex}`);
        continue;
      }

      const document = this.enterpriseDocumentRepository.create({
        ...docData,
        enterpriseId: enterprise.id,
      });
      await this.enterpriseDocumentRepository.save(document);

      this.logger.log(
        `Created document: ${docData.type} for ${enterprise.name} (Status: ${docData.status})`,
      );
    }

    this.logger.log('✅ Successfully seeded enterprise documents');
  }
}
