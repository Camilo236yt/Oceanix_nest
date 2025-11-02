import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { FilterableOptions } from '../interfaces';

export function Filterable(options: FilterableOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    
    const decorators: Array<MethodDecorator & ClassDecorator> = [];
    
    // Siempre incluye paginación
    decorators.push(
      ApiQuery({ 
        name: 'page', 
        required: false, 
        description: 'Número de página', 
        example: 1,
        type: Number
      }),
      ApiQuery({ 
        name: 'limit', 
        required: false, 
        description: 'Cantidad de elementos por página', 
        example: 10,
        type: Number
      })
    );
    
    // Search (default: true)
    if (options.search !== false) {
      decorators.push(
        ApiQuery({ 
          name: 'search', 
          required: false, 
          description: 'Búsqueda general en campos de texto',
          example: 'playa',
          type: String
        })
      );
    }
    
    // Date filters
    if (options.date) {
      decorators.push(
        ApiQuery({ 
          name: 'startDate', 
          required: false, 
          description: 'Fecha inicial del filtro (YYYY-MM-DD)', 
          example: '2024-01-01',
          type: String,
          format: 'date'
        }),
        ApiQuery({ 
          name: 'endDate', 
          required: false, 
          description: 'Fecha final del filtro (YYYY-MM-DD)', 
          example: '2024-12-31',
          type: String,
          format: 'date'
        })
      );
    }
    
    // Price filters
    if (options.price) {
      decorators.push(
        ApiQuery({ 
          name: 'minPrice', 
          required: false, 
          description: 'Precio mínimo', 
          example: 100,
          type: Number,
          minimum: 0
        }),
        ApiQuery({ 
          name: 'maxPrice', 
          required: false, 
          description: 'Precio máximo', 
          example: 1000,
          type: Number,
          minimum: 0
        })
      );
    }
    
    // Location filters
    if (options.location) {
      decorators.push(
        ApiQuery({ 
          name: 'latitude', 
          required: false, 
          description: 'Latitud geográfica', 
          example: 40.7128,
          type: Number,
          minimum: -90,
          maximum: 90
        }),
        ApiQuery({ 
          name: 'longitude', 
          required: false, 
          description: 'Longitud geográfica', 
          example: -74.006,
          type: Number,
          minimum: -180,
          maximum: 180
        }),
        ApiQuery({ 
          name: 'radius', 
          required: false, 
          description: 'Radio de búsqueda en kilómetros', 
          example: 50,
          type: Number,
          minimum: 1
        })
      );
    }
    
    // Sort
    if (options.sort) {
      decorators.push(
        ApiQuery({ 
          name: 'sortBy', 
          required: false, 
          description: 'Campo por el cual ordenar',
          example: 'createdAt',
          type: String
        }),
        ApiQuery({ 
          name: 'sortOrder', 
          required: false, 
          description: 'Orden de clasificación', 
          enum: ['ASC', 'DESC'],
          example: 'DESC'
        })
      );
    }
    
    // Custom filters
    if (options.customFilters && options.customFilters.length > 0) {
      options.customFilters.forEach(filter => {
        decorators.push(
          ApiQuery({ 
            name: filter, 
            required: false, 
            description: `Filtro personalizado: ${filter}`,
            type: String
          })
        );
      });
    }
    
    return applyDecorators(...decorators)(target, propertyName, descriptor);
  };
}