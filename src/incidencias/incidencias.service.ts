import { Injectable } from '@nestjs/common';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Incidencia } from './entities/incidencia.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IncidenciasService {

constructor(

@InjectRepository(Incidencia)
private readonly incidenciaRepository: Repository<Incidencia>

) {}

  
async  create(createIncidenciaDto: CreateIncidenciaDto) {
const tenantId = 'obtenido-del-contexto-de-multi-tenancy'; // Aquí deberías obtener el tenantId del contexto actual

return await  this.incidenciaRepository.save({tenantId, ...createIncidenciaDto});

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
