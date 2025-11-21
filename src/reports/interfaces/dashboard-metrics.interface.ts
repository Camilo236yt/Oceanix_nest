export interface IncidenciasPorTipo {
  perdidas: number;
  retrasos: number;
  danos: number;
  otros: number;
}

export interface EstadoIncidencias {
  resueltas: {
    count: number;
    percentage: number;
  };
  pendientes: {
    count: number;
    percentage: number;
  };
  criticas: {
    count: number;
    percentage: number;
  };
}

export interface DashboardMetrics {
  incidenciasPorTipo: IncidenciasPorTipo;
  estadoIncidencias: EstadoIncidencias;
}
