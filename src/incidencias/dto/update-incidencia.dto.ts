import { PartialType } from '@nestjs/mapped-types';
import { CreateIncidenciaDto } from './create-incidencia.dto';

export class UpdateIncidenciaDto extends PartialType(CreateIncidenciaDto) {}
