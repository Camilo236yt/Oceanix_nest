import { Role } from '../entities/role.entity';

export class RoleTransformer {
  static toResponse(role: Role) {
    // Manejar casos donde role o sus propiedades puedan ser undefined
    if (!role) {
      return null;
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive ?? true,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions?.map(rp => rp?.permission?.name).filter(Boolean) || []
    };
  }

  static toPaginatedResponse(data: { data: Role[]; total: number; meta: any }) {
    return {
      data: data.data.map(role => this.toResponse(role)).filter(Boolean),
      total: data.total,
      meta: data.meta
    };
  }
}
