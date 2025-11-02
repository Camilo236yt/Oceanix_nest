import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Filterable, FilterParams, Cached } from 'src/common/decorators';
import { FilterParamsDto } from 'src/common/dto/filters';

import { Auth, GetUser } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SafeUserResponseDto, sanitizeUserForCache, sanitizeUsersArrayForCache } from './dto/safe-user-response.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Auth(ValidPermission.createUsers)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado', type: SafeUserResponseDto })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    
    // La invalidación de caché es automática vía eventos
    return sanitizeUserForCache(user);
  }

  @Get('internal')
  @Auth(ValidPermission.manageUsers)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Obtener usuarios internos (con roles)',
    description: 'Retorna usuarios que tienen al menos un rol asignado (administradores, empleados, etc.)'
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios internos paginada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  @Cached({ keyPrefix: 'users', ttl: 600 })
  async findInternalUsers(@Query() paginationDto: PaginationDto) {
    const users = await this.usersService.findInternalUsers(paginationDto);
    
    // Sanitizar datos antes de devolver
    return {
      ...users,
      data: sanitizeUsersArrayForCache(users.data)
    };
  }


  @Get()
  @Auth(ValidPermission.manageUsers)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Obtener usuarios del sistema con filtros avanzados',
    description: 'Devuelve SOLO usuarios con roles asignados (administradores, empleados, etc.). Permite buscar por email, nombre, filtrar por usuario activo/inactivo, email verificado/no verificado, etc. Este endpoint está configurado para mostrar únicamente usuarios del sistema por seguridad.'
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios filtrada y paginada', type: [SafeUserResponseDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  @Filterable({ 
    date: true, 
    sort: true,
    customFilters: ['isActive', 'isEmailVerified', 'role.id', 'role.name', 'roles.id', 'roles.name', 'createdAfter', 'createdBefore']
  })
  @Cached({ keyPrefix: 'users', ttl: 600 })
  async findAll(
    @FilterParams({ 
      date: true, 
      sort: true,
      customFilters: ['isActive', 'isEmailVerified', 'role.id', 'role.name', 'roles.id', 'roles.name', 'createdAfter', 'createdBefore']
    }) params: FilterParamsDto
  ) {
    const users = await this.usersService.findWithFilters(params);
    
    // Sanitizar datos antes de devolver
    return {
      ...users,
      data: sanitizeUsersArrayForCache(users.data)
    };
  }

  @Get(':id')
  @Auth(ValidPermission.manageUsers)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un usuario por su ID' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: SafeUserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  @Cached({ keyPrefix: 'users', ttl: 600 })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    
    // Sanitizar datos antes de devolver
    return sanitizeUserForCache(user);
  }


  @Patch(':id')
  @Auth(ValidPermission.editUsers)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un usuario por su ID' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado', type: SafeUserResponseDto })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    
    // La invalidación de caché es automática vía eventos
    return sanitizeUserForCache(user);
  }

  @Delete(':id')
  @Auth(ValidPermission.deleteUsers)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar un usuario por su ID' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async remove(@Param('id') id: string) {
    const result = await this.usersService.remove(id);
    
    // La invalidación de caché es automática vía eventos
    return result;
  }
}
