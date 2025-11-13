import { IsEnum, IsString, MinLength } from "class-validator";
import { incidenciaStatus } from "./enum/status-incidencias.enum";
import { TipoIncidencia } from "./enum/status-incidencias.enum"; // ✅ importar nuevo enum

export class CreateIncidenciaDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  description: string;

  @IsEnum(incidenciaStatus)
  status: incidenciaStatus;

  @IsEnum(TipoIncidencia) // ✅ nueva propiedad para el tipo de incidencia
  tipo: TipoIncidencia;

  @IsString()
  photoUrl?: string;

  @IsString()
  ProducReferenceId: string;
}
