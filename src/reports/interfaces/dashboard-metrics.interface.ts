export interface TiempoPromedioMes {
  mes: string;
  promedio: number; // en días
}

export interface CumplimientoEmpresa {
  empresa: string;
  porcentaje: number;
}

export interface DashboardMetrics {
  tiempoPromedioRespuesta: TiempoPromedioMes[];
  porcentajeCumplimientoEmpresa: CumplimientoEmpresa[];
}
