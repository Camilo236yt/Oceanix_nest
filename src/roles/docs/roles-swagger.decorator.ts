import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import {
  SwaggerGetAllOperation
} from '../../common/decorators/swagger-crud-operations.decorator';
import { Role } from '../entities/role.entity';

export function SwaggerGetRolesWithFilters() {
  return applyDecorators(
    SwaggerGetAllOperation('Obtener roles con filtros avanzados y paginación', Role),
    ApiQuery({
      name: 'page',
      required: false,
      type: 'number',
      description: 'Número de página para paginación (por defecto: 1)'
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: 'number',
      description: 'Cantidad de resultados por página (por defecto: 10, máximo: 100)'
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: 'string',
      description: 'Buscar por nombre o descripción del rol'
    }),
    ApiQuery({
      name: 'isActive',
      required: false,
      type: 'boolean',
      description: 'Filtrar por estado del rol (true=activo, false=inactivo)'
    }),
    ApiQuery({
      name: 'createdAfter',
      required: false,
      type: 'string',
      description: 'Filtrar roles creados después de esta fecha (formato ISO 8601: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)'
    }),
    ApiQuery({
      name: 'createdBefore',
      required: false,
      type: 'string',
      description: 'Filtrar roles creados antes de esta fecha (formato ISO 8601: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)'
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['id', 'name', 'createdAt'],
      description: 'Columna para ordenar los resultados'
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Dirección del ordenamiento (ASC=ascendente, DESC=descendente)'
    })
  );
}
