import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateIncidenciaDto } from './create-incidencia.dto';
import { IncidenciaStatus } from '../enums/incidencia.enums';

export class UpdateIncidenciaDto extends PartialType(CreateIncidenciaDto) {
  @IsOptional()
  @IsEnum(IncidenciaStatus)
  status?: IncidenciaStatus;
}
