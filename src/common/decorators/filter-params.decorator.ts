import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FilterableOptions } from '../interfaces';
import { FilterParamsDto } from '../dto/filters';

export const FilterParams = createParamDecorator(
  (options: FilterableOptions = {}, ctx: ExecutionContext): FilterParamsDto => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;
    
    // Función helper para convertir string a número de forma segura
    const toNumber = (value: any): number | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    };
    
    // Función helper para convertir string a boolean
    const toBoolean = (value: any): boolean | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return undefined;
    };
    
    const result: FilterParamsDto = {
      // Paginación siempre presente
      pagination: {
        page: toNumber(query.page) || 1,
        limit: toNumber(query.limit) || 10
      },
      
      // Search (si está habilitado, default: true)
      ...(options.search !== false && query.search && {
        search: String(query.search).trim()
      }),
      
      // Date range (si está habilitado)
      ...(options.date && (query.startDate || query.endDate) && {
        dateRange: {
          ...(query.startDate && { startDate: String(query.startDate) }),
          ...(query.endDate && { endDate: String(query.endDate) })
        }
      }),
      
      // Price range (si está habilitado)
      ...(options.price && (query.minPrice || query.maxPrice) && {
        priceRange: {
          ...(query.minPrice && { minPrice: toNumber(query.minPrice) }),
          ...(query.maxPrice && { maxPrice: toNumber(query.maxPrice) })
        }
      }),
      
      // Location (si está habilitado)
      ...(options.location && (query.latitude || query.longitude) && {
        location: {
          ...(query.latitude && { latitude: toNumber(query.latitude) }),
          ...(query.longitude && { longitude: toNumber(query.longitude) }),
          ...(query.radius && { radius: toNumber(query.radius) })
        }
      }),
      
      // Sorting (si está habilitado)
      ...(options.sort && query.sortBy && {
        sort: {
          sortBy: String(query.sortBy),
          sortOrder: (query.sortOrder === 'ASC' || query.sortOrder === 'DESC') 
            ? query.sortOrder 
            : 'DESC'
        }
      }),
      
      // Custom filters
      ...(options.customFilters && options.customFilters.length > 0 && {
        customFilters: Object.fromEntries(
          options.customFilters
            .map(filter => {
              const value = query[filter];
              if (value === undefined || value === null || value === '') {
                return null;
              }
              
              // Para campos que terminan en .id (UUIDs), tratarlos como strings directamente
              if (filter.endsWith('.id')) {
                return [filter, String(value)];
              }
              
              // Para campos específicamente booleanos
              if (filter === 'isActive') {
                const boolValue = toBoolean(value);
                if (boolValue !== undefined) {
                  return [filter, boolValue];
                }
              }
              
              // Intentar convertir a número si es posible (para rangos como minRating, maxRating)
              const numValue = toNumber(value);
              if (numValue !== undefined) {
                return [filter, numValue];
              }
              
              // Si es un array (valores separados por coma)
              if (typeof value === 'string' && value.includes(',')) {
                return [filter, value.split(',').map(v => v.trim())];
              }
              
              // Retornar como string por defecto
              return [filter, String(value)];
            })
            .filter(entry => entry !== null) // Filtrar valores nulos
        )
      })
    };
    
    // Limpiar campos undefined del resultado
    Object.keys(result).forEach(key => {
      if (result[key] === undefined) {
        delete result[key];
      }
    });
    
    return result;
  },
);