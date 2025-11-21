export interface KPICard {
  value: number | string;
  label: string;
  trend?: string; // ej: "+12% vs mes anterior"
  trendDirection?: 'up' | 'down';
  icon?: string;
}

export interface IncidenciasPorTipo {
  perdidas: number;
  retrasos: number;
  danos: number;
  otros: number;
}

export interface EstadoIncidencia {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DashboardData {
  // KPIs principales
  totalIncidencias: KPICard;
  incidenciasResueltas: KPICard;
  pendientes: KPICard;
  tiempoPromedio: KPICard;

  // Gráfica de barras: Incidencias por tipo
  incidenciasPorTipo: IncidenciasPorTipo;

  // Gráfica de dona: Estado de incidencias
  estadoIncidencias: EstadoIncidencia[];

  // Metadata
  fechaConsulta: string;
  periodo: string;
}
