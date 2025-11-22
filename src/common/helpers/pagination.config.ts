import { PaginateConfig } from 'nestjs-paginate';

/**
 * Configuración base común para paginación en todos los módulos
 * Establece valores por defecto consistentes en toda la aplicación
 */
export const basePaginationConfig: Partial<PaginateConfig<any>> = {
  // Número máximo de items por página permitido
  maxLimit: 100,

  // Número de items por defecto si no se especifica limit
  defaultLimit: 10,

  // Ordenamiento por defecto (puede ser sobrescrito por cada módulo)
  defaultSortBy: [['createdAt', 'DESC']],

  // Carga solo el conteo sin los datos cuando se pide
  loadEagerRelations: false,

  // Formato de la respuesta con links HATEOAS
  relativePath: true,
};

/**
 * Helper para crear configuraciones de paginación con valores base
 * Combina la configuración base con configuración específica del módulo
 *
 * @param config - Configuración específica del módulo
 * @returns Configuración completa de paginación
 *
 * @example
 * ```typescript
 * const config = createPaginationConfig({
 *   sortableColumns: ['name', 'email'],
 *   searchableColumns: ['name', 'email'],
 *   filterableColumns: {
 *     isActive: [FilterOperator.EQ]
 *   }
 * });
 * ```
 */
export function createPaginationConfig<T>(
  config: Omit<PaginateConfig<T>, keyof typeof basePaginationConfig>,
): PaginateConfig<T> {
  return {
    ...basePaginationConfig,
    ...config,
  } as PaginateConfig<T>;
}
