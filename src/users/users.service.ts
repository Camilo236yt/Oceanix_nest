import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { BaseFilterService } from 'src/common/services';
import { FilterType } from 'src/common/enums';
import { FilterParamsDto } from 'src/common/dto/filters';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserEvent } from 'src/common/interfaces';

@Injectable()
export class UsersService extends BaseFilterService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Llamar al constructor del BaseFilterService
    super(userRepository, 'user');
  }

  // Implementar métodos requeridos por BaseFilterService
  getSearchableFields(): string[] {
    return ['name', 'lastName', 'email', 'phoneNumber'];
  }

  getSortableFields(): string[] {
    return ['id', 'name', 'lastName', 'email', 'createdAt'];
  }

  getFilterableFields(): Record<string, FilterType> {
    return {
      'isActive': FilterType.BOOLEAN,
      'isEmailVerified': FilterType.BOOLEAN,
      // Compatibilidad con ambos nombres (con y sin 's')
      'role.id': FilterType.EQUALS,     // Para Swagger
      'roles.id': FilterType.EQUALS,    // Para el alias real
      'role.name': FilterType.EQUALS,   // Para Swagger
      'roles.name': FilterType.EQUALS,  // Para el alias real
      'createdAfter': FilterType.GREATER_THAN_OR_EQUAL,
      'createdBefore': FilterType.LESS_THAN_OR_EQUAL,
    };
  }

  // Método para obtener campo de fecha (usuarios SÍ tienen createdAt)
  getDateField(): string | null {
    return 'createdAt';
  }

  // Método para cargar relaciones automáticamente - pero el join completo se maneja en findWithFilters
  getRelations(): string[] {
    return []; // Manejamos manualmente en findWithFilters para cargar roles con la información completa
  }

  // Sobrescribir findWithFilters para forzar hasRoles=true por defecto
  async findWithFilters(params: FilterParamsDto): Promise<{
    data: User[];
    total: number;
    meta: any;
  }> {
    // FORZAR hasRoles=true por defecto - no permitir que se cambie via petición
    if (!params.customFilters) {
      params.customFilters = {};
    }
    
    // Siempre forzar hasRoles=true, ignorar cualquier valor enviado
    params.customFilters.hasRoles = true;

    const qb = this.userRepository.createQueryBuilder(this.entityName);
    
    // Cargar relaciones de roles con la información del rol
    qb.leftJoinAndSelect(`${this.entityName}.roles`, 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'roles');
    
    // Aplicar filtros base (búsqueda, fechas, etc.) - sin customFilters aún
    const baseParams = { ...params, customFilters: { ...params.customFilters } };
    delete baseParams.customFilters.hasRoles; // Remover temporalmente hasRoles
    
    // Aplicar búsqueda
    if (params.search) {
      const searchableFields = this.getSearchableFields();
      if (searchableFields.length > 0) {
        const conditions = searchableFields.map((field, index) => {
          const paramName = `search${index}`;
          if (field.includes('.')) {
            return `${field} ILIKE :${paramName}`;
          } else {
            return `${this.entityName}.${field} ILIKE :${paramName}`;
          }
        });
        
        const whereClause = `(${conditions.join(' OR ')})`;
        const parameters = Object.fromEntries(
          searchableFields.map((_, index) => [`search${index}`, `%${params.search!.trim()}%`])
        );
        
        qb.andWhere(whereClause, parameters);
      }
    }
    
    // Aplicar filtros de fecha
    if (params.dateRange) {
      const dateField = this.getDateField();
      if (dateField) {
        if (params.dateRange.startDate) {
          qb.andWhere(`${this.entityName}.${dateField} >= :startDate`, { 
            startDate: new Date(params.dateRange.startDate)
          });
        }
        
        if (params.dateRange.endDate) {
          const endDate = new Date(params.dateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
          qb.andWhere(`${this.entityName}.${dateField} <= :endDate`, { 
            endDate: endDate
          });
        }
      }
    }
    
    // Aplicar otros filtros personalizados (excepto hasRoles)
    if (baseParams.customFilters && Object.keys(baseParams.customFilters).length > 0) {
      const filterableFields = this.getFilterableFields();
      
      Object.entries(baseParams.customFilters).forEach(([field, value]) => {
        if (filterableFields[field] && value !== undefined && value !== null && value !== '') {
          const filterType = filterableFields[field];
          const paramName = `custom_${field.replace(/\./g, '_')}`;
          // Mapear role.* a roles.* para compatibilidad con Swagger
          let fieldPath = field.includes('.') ? field : `${this.entityName}.${field}`;
          if (field.startsWith('role.')) {
            fieldPath = field.replace('role.', 'roles.');
          }

          console.log(`🔍 Applying filter: ${field} = ${value} (fieldPath: ${fieldPath})`);

          switch (filterType) {
            case FilterType.EQUALS:
              if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                console.log(`📝 Adding WHERE clause: ${fieldPath} = :${paramName}`);
                qb.andWhere(`${fieldPath} = :${paramName}`, { [paramName]: value });
              }
              break;
            case FilterType.BOOLEAN:
              const boolValue = typeof value === 'boolean' ? value : value === 'true';
              console.log(`📝 Adding WHERE clause: ${fieldPath} = :${paramName} (boolean: ${boolValue})`);
              qb.andWhere(`${fieldPath} = :${paramName}`, { [paramName]: boolValue });
              break;
            // Agregar otros casos según necesidad
          }
        }
      });
    }
    
    // Aplicar filtro hasRoles específico
    const hasRoles = typeof params.customFilters.hasRoles === 'boolean' 
      ? params.customFilters.hasRoles 
      : params.customFilters.hasRoles === 'true';
    
    if (hasRoles) {
      qb.andWhere('userRoles.id IS NOT NULL');
    } else {
      qb.andWhere('userRoles.id IS NULL');
    }
    
    // Aplicar ordenamiento
    if (params.sort?.sortBy) {
      const sortableFields = this.getSortableFields();
      if (sortableFields.includes(params.sort.sortBy)) {
        const sortOrder = params.sort.sortOrder || 'DESC';
        if (params.sort.sortBy.includes('.')) {
          qb.orderBy(params.sort.sortBy, sortOrder);
        } else {
          qb.orderBy(`${this.entityName}.${params.sort.sortBy}`, sortOrder);
        }
      }
    } else {
      qb.orderBy(`${this.entityName}.name`, 'ASC');
    }
    
    // Aplicar paginación
    const pagination = {
      page: params.pagination.page || 1,
      limit: Math.min(params.pagination.limit || 10, 100)
    };
    
    const offset = (pagination.page - 1) * pagination.limit;
    qb.skip(offset).take(pagination.limit);
    
    // Debug: Log del SQL generado
    console.log(`🔍 Generated SQL: ${qb.getQuery()}`);
    console.log(`🔍 Parameters:`, qb.getParameters());

    const [data, total] = await qb.getManyAndCount();
    
    return {
      data,
      total,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.page < Math.ceil(total / pagination.limit),
        hasPrev: pagination.page > 1,
        from: total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0,
        to: Math.min(pagination.page * pagination.limit, total)
      }
    };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // Verificar que el email no esté duplicado
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });
    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    // VALIDACIÓN OBLIGATORIA: Los usuarios del sistema DEBEN tener roles
    if (!createUserDto.roleIds || createUserDto.roleIds.length === 0) {
      throw new BadRequestException('Los usuarios del sistema deben tener al menos un rol asignado');
    }

    // Validar que todos los roles existan y estén activos
    const roles = await this.roleRepository.find({
      where: createUserDto.roleIds.map(id => ({ id, isActive: true }))
    });

    if (roles.length !== createUserDto.roleIds.length) {
      const foundRoleIds = roles.map(r => r.id);
      const missingRoles = createUserDto.roleIds.filter(id => !foundRoleIds.includes(id));
      throw new BadRequestException(`Los siguientes roles no existen o están inactivos: ${missingRoles.join(', ')}`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      name: createUserDto.name,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      phoneNumber: createUserDto.phoneNumber,
      password: hashedPassword,
      isActive: createUserDto.isActive ?? true,
      isEmailVerified: true, // Los usuarios creados por admin están verificados
    });

    const savedUser = await this.userRepository.save(user);

    // Asignar roles (ya validados anteriormente)
    const userRoles = createUserDto.roleIds.map(roleId =>
      this.userRoleRepository.create({
        user: savedUser,
        role: { id: roleId } as Role
      })
    );
    await this.userRoleRepository.save(userRoles);

    // Emit event for cache invalidation
    const userEvent: UserEvent = {
      id: savedUser.id,
      operation: 'created',
      data: savedUser
    };
    this.eventEmitter.emit('user.created', userEvent);

    // Retornar usuario con roles cargados
    const userWithRoles = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['roles', 'roles.role']
    });

    if (!userWithRoles) {
      throw new NotFoundException('Usuario creado pero no encontrado');
    }

    return userWithRoles;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findInternalUsers(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const [data, total] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('roles.id IS NOT NULL') // Tiene al menos un rol
      .orderBy('user.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }


  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role']
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { password, confirmPassword, roleIds, ...restOfFields } = updateUserDto;

    // Verificar que el usuario existe
    const existingUser = await this.userRepository.findOne({
      where: { id },
      relations: ['roles']
    });
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Validar contraseñas
    if ((password && !confirmPassword) || (!password && confirmPassword)) {
      throw new BadRequestException(
        'Debe enviar ambas contraseñas para actualizar la contraseña',
      );
    }

    if (password && confirmPassword && password !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // VALIDACIÓN DE ROLES: Si se envían roles, debe tener al menos uno
    if (roleIds !== undefined) {
      if (roleIds.length === 0) {
        throw new BadRequestException('Los usuarios del sistema deben tener al menos un rol asignado');
      }

      // Validar que todos los roles existan y estén activos
      const roles = await this.roleRepository.find({
        where: roleIds.map(roleId => ({ id: roleId, isActive: true }))
      });

      if (roles.length !== roleIds.length) {
        const foundRoleIds = roles.map(r => r.id);
        const missingRoles = roleIds.filter(id => !foundRoleIds.includes(id));
        throw new BadRequestException(`Los siguientes roles no existen o están inactivos: ${missingRoles.join(', ')}`);
      }
    }

    const updateData: Partial<User> = { ...restOfFields };

    if (password && confirmPassword) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await this.userRepository.update(id, updateData);

    // Actualizar roles si se proporcionaron
    if (roleIds !== undefined) {
      // Eliminar roles existentes
      await this.userRoleRepository.delete({ user: { id } });

      // Asignar nuevos roles
      const newUserRoles = roleIds.map(roleId =>
        this.userRoleRepository.create({
          user: { id } as User,
          role: { id: roleId } as Role
        })
      );
      await this.userRoleRepository.save(newUserRoles);
    }

    const updatedUser = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role']
    });

    if (!updatedUser) {
      throw new NotFoundException('Usuario actualizado pero no encontrado');
    }

    // Emit event for cache invalidation
    const userEvent: UserEvent = {
      id: updatedUser.id,
      operation: 'updated',
      data: updatedUser
    };
    this.eventEmitter.emit('user.updated', userEvent);

    return updatedUser;
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    await this.userRepository.update(id, updateProfileDto);
    
    const updatedUser = await this.findOne(id);

    // Emit event for cache invalidation
    const userEvent: UserEvent = {
      id: updatedUser.id,
      operation: 'updated',
      data: updatedUser
    };
    this.eventEmitter.emit('user.updated', userEvent);

    return updatedUser;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto;

    // Verificar que las nuevas contraseñas coincidan
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Las nuevas contraseñas no coinciden');
    }

    // Buscar el usuario
    const user = await this.findOne(id);

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Encriptar nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await this.userRepository.update(id, { password: hashedNewPassword });
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    user.isActive = false;
    await this.userRepository.save(user);

    // Emit event for cache invalidation
    const userEvent: UserEvent = {
      id: user.id,
      operation: 'deleted',
      data: { id: user.id, isActive: false }
    };
    this.eventEmitter.emit('user.deleted', userEvent);

    return { message: 'Usuario desactivado correctamente' };
  }
}
