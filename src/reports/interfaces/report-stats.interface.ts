export interface EstadisticaCount {
  count: number;
  percentage: number;
}

export interface Estadisticas {
  totalIncidencias: number;
  resueltas: number;
  pendientes: number;
  tiempoPromedioResolucion: string;
}

export interface DistribucionEstados {
  resueltas: EstadisticaCount;
  pendientes: EstadisticaCount;
  criticas: EstadisticaCount;
}

export interface IncidenciasPorTipo {
  perdidas: number;
  retrasos: number;
  danos: number;
  otros: number;
}

export interface MetricasClave {
  tasaResolucion: string;
  incidenciasCriticas: number;
  eficienciaOperativa: string;
  tendenciaMensual: string;
}

export interface InformacionReporte {
  fechaGeneracion: string;
  periodo: string;
  sistema: string;
}

export interface DashboardReport {
  estadisticas: Estadisticas;
  distribucionEstados: DistribucionEstados;
  incidenciasPorTipo: IncidenciasPorTipo;
  metricasClave: MetricasClave;
  informacionReporte: InformacionReporte;
}
