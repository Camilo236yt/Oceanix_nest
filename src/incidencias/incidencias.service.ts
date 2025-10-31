import { Injectable } from '@nestjs/common';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';

@Injectable()
export class IncidenciasService {
  create(createIncidenciaDto: CreateIncidenciaDto) {
    return 'This action adds a new incidencias';
  }

  findAll() {
    return `This action returns all incidencia`;
  }

  findOne(id: number) {
    return `This action returns a #${id} incidencia`;
  }

  update(id: number, updateIncidenciaDto: UpdateIncidenciaDto) {
    return `This action updates a #${id} incidencia`;
  }

  remove(id: number) {
    return `This action removes a #${id} incidencia`;
  }
}
