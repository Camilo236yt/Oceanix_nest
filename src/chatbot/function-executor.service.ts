import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { ValidPermission } from '../auth/interfaces/valid-permission';
import { IncidenciasService } from '../incidencias/incidencias.service';
import { UsersService } from '../users/users.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { RolesService } from '../roles/roles.service';

export interface FunctionExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    structuredData?: {
        type: 'table' | 'list' | 'card' | 'stat';
        data: any;
    };
}

@Injectable()
export class FunctionExecutorService {
    private readonly logger = new Logger(FunctionExecutorService.name);

    constructor(
        private readonly incidenciasService: IncidenciasService,
        private readonly usersService: UsersService,
        private readonly dashboardService: DashboardService,
        private readonly rolesService: RolesService,
    ) { }

    /**
     * Ejecuta una función solicitada por la IA
     */
    async execute(
        functionName: string,
        args: Record<string, any>,
        user: User
    ): Promise<FunctionExecutionResult> {
        this.logger.log(`Executing function: ${functionName} for user ${user.id}`);

        try {
            switch (functionName) {
                case 'get_incidents':
                    return await this.getIncidents(args, user);

                case 'get_incident_details':
                    return await this.getIncidentDetails(args, user);

                case 'get_users':
                    return await this.getUsers(args, user);

                case 'get_user_details':
                    return await this.getUserDetails(args, user);

                case 'get_my_profile':
                    return await this.getMyProfile(user);

                case 'get_dashboard_stats':
                    return await this.getDashboardStats(user);

                case 'get_roles':
                    return await this.getRoles(user);

                default:
                    throw new BadRequestException(`Función desconocida: ${functionName}`);
            }
        } catch (error) {
            this.logger.error(`Error executing function ${functionName}:`, error);
            return {
                success: false,
                error: error.message || 'Error al ejecutar la función'
            };
        }
    }

    /**
     * Obtiene lista de incidencias
     */
    private async getIncidents(args: any, user: User): Promise<FunctionExecutionResult> {
        this.checkPermission(user, ValidPermission.viewIncidents);

        const limit = Math.min(args.limit || 10, 50);
        const page = args.page || 1;

        const query = {
            page,
            limit,
            path: '',
            filter: {},
            sortBy: [['createdAt', 'DESC']]
        };

        // Apply filters if provided
        if (args.status) {
            query.filter['status'] = `$eq:${args.status}`;
        }

        const result = await this.incidenciasService.findAllPaginated(query as any, user.enterpriseId);

        return {
            success: true,
            data: result,
            structuredData: {
                type: 'table',
                data: {
                    headers: ['ID', 'Nombre', 'Estado', 'Prioridad', 'Creado'],
                    rows: result.data.map(inc => [
                        inc.id.substring(0, 8) + '...',
                        inc.name,
                        inc.status,
                        inc.alertLevel,
                        new Date(inc.createdAt).toLocaleDateString()
                    ]),
                    pagination: {
                        currentPage: result.meta.currentPage,
                        totalPages: result.meta.totalPages,
                        total: result.meta.totalItems
                    }
                }
            }
        };
    }

    /**
     * Obtiene detalles de una incidencia específica
     */
    private async getIncidentDetails(args: any, user: User): Promise<FunctionExecutionResult> {
        this.checkPermission(user, ValidPermission.viewIncidents);

        if (!args.incidentId) {
            throw new BadRequestException('Se requiere incidentId');
        }

        const incident = await this.incidenciasService.findOne(args.incidentId, user.enterpriseId);

        return {
            success: true,
            data: incident,
            structuredData: {
                type: 'card',
                data: {
                    title: incident.name,
                    fields: [
                        { label: 'Estado', value: incident.status },
                        { label: 'Tipo', value: incident.tipo },
                        { label: 'Prioridad', value: incident.alertLevel },
                        { label: 'Descripción', value: incident.description },
                        { label: 'Creado', value: new Date(incident.createdAt).toLocaleString() },
                    ]
                }
            }
        };
    }

    /**
     * Obtiene lista de usuarios
     */
    private async getUsers(args: any, user: User): Promise<FunctionExecutionResult> {
        this.checkPermission(user, ValidPermission.viewUsers);

        const limit = Math.min(args.limit || 10, 50);
        const page = args.page || 1;

        const query = {
            page,
            limit,
            path: '',
            sortBy: [['name', 'ASC']]
        };

        const result = await this.usersService.findAllPaginated(query as any, user.enterpriseId);

        return {
            success: true,
            data: result,
            structuredData: {
                type: 'table',
                data: {
                    headers: ['Nombre', 'Email', 'Tipo', 'Estado'],
                    rows: result.data.map(u => [
                        `${u.name} ${u.lastName}`,
                        u.email,
                        u.userType,
                        u.isActive ? 'Activo' : 'Inactivo'
                    ]),
                    pagination: {
                        currentPage: result.meta.currentPage,
                        totalPages: result.meta.totalPages,
                        total: result.meta.totalItems
                    }
                }
            }
        };
    }

    /**
     * Obtiene detalles de un usuario específico
     */
    private async getUserDetails(args: any, user: User): Promise<FunctionExecutionResult> {
        this.checkPermission(user, ValidPermission.viewUsers);

        if (!args.userId) {
            throw new BadRequestException('Se requiere userId');
        }

        const targetUser = await this.usersService.findOne(args.userId, true, user.enterpriseId);

        return {
            success: true,
            data: targetUser,
            structuredData: {
                type: 'card',
                data: {
                    title: `${targetUser.name} ${targetUser.lastName}`,
                    fields: [
                        { label: 'Email', value: targetUser.email },
                        { label: 'Tipo', value: targetUser.userType },
                        { label: 'Estado', value: targetUser.isActive ? 'Activo' : 'Inactivo' },
                        { label: 'Teléfono', value: targetUser.phoneNumber || 'N/A' },
                    ]
                }
            }
        };
    }

    /**
     * Obtiene perfil del usuario actual
     */
    private async getMyProfile(user: User): Promise<FunctionExecutionResult> {
        return {
            success: true,
            data: user,
            structuredData: {
                type: 'card',
                data: {
                    title: 'Mi Perfil',
                    fields: [
                        { label: 'Nombre', value: `${user.name} ${user.lastName}` },
                        { label: 'Email', value: user.email },
                        { label: 'Tipo de usuario', value: user.userType },
                        { label: 'Teléfono', value: user.phoneNumber || 'N/A' },
                    ]
                }
            }
        };
    }

    /**
   * Obtiene estadísticas del dashboard
   */
    private async getDashboardStats(user: User): Promise<FunctionExecutionResult> {
        this.checkPermission(user, ValidPermission.readDashboard);

        // TODO: Implement when DashboardService.getStats is available
        return {
            success: true,
            data: { message: 'Estadísticas del dashboard próximamente disponibles' },
            structuredData: {
                type: 'stat',
                data: {
                    stats: [
                        { label: 'Total Incidencias', value: 0 },
                        { label: 'Pendientes', value: 0 },
                        { label: 'En Progreso', value: 0 },
                        { label: 'Resueltas', value: 0 },
                    ]
                }
            }
        };
    }

    /**
   * Obtiene roles de la empresa
   */
    private async getRoles(user: User): Promise<FunctionExecutionResult> {
        this.checkPermission(user, ValidPermission.getRoles);

        const roles = await this.rolesService.findAll(user.enterpriseId);

        return {
            success: true,
            data: roles,
            structuredData: {
                type: 'list',
                data: {
                    items: roles.map(role => ({
                        id: role.id,
                        name: role.name,
                        description: role.description,
                        permissionCount: role.permissions?.length || 0
                    }))
                }
            }
        };
    }

    /**
   * Verifica si el usuario tiene un permiso específico
   */
    private checkPermission(user: User, permission: ValidPermission): void {
        // SUPER_ADMIN bypass
        if (user.userType === 'SUPER_ADMIN') {
            return;
        }

        // Get all permissions from user's roles
        const userPermissions = new Set<string>();

        if (user.roles && user.roles.length > 0) {
            for (const userRole of user.roles) {
                if (userRole.role && userRole.role.permissions) {
                    for (const rolePermission of userRole.role.permissions) {
                        if (rolePermission.permission && rolePermission.permission.name) {
                            userPermissions.add(rolePermission.permission.name);
                        }
                    }
                }
            }
        }

        if (!userPermissions.has(permission)) {
            this.logger.warn(`User ${user.id} attempted to execute function requiring ${permission}`);
            throw new ForbiddenException(`No tienes permiso para realizar esta acción`);
        }
    }
}
