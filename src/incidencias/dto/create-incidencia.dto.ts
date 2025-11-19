import { IsEnum, IsString, MinLength } from 'class-validator';
import { TipoIncidencia } from '../enums/incidencia.enums';

export class CreateIncidenciaDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  description: string;

  @IsEnum(TipoIncidencia)
  tipo: TipoIncidencia;
}
