import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Incidencia } from './entities/incidencia.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IncidenciasService {
//TODO: PAGINACIÓN ULTIMO
  constructor(
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>
  ) {}

  async create(createIncidenciaDto: CreateIncidenciaDto) {
    // Se mantiene un tenantId de ejemplo. En producción debe venir del contexto o del token.
    const tenantId = 'obtenido-del-contexto-de-multi-tenancy';

    // Se crea una nueva instancia de la entidad usando el DTO + tenantId
    const incidencia = this.incidenciaRepository.create({
      tenantId,
      ...createIncidenciaDto
    });

    // Se guarda la incidencia en base de datos
    return await this.incidenciaRepository.save(incidencia);
  }

  async findAll() {
    // Antes era un string estático; ahora devuelve las incidencias reales desde el repositorio.
    return await this.incidenciaRepository.find();
  }

  async findOne(id: string) {
    // Se cambió el tipo de id (antes number) porque la entidad usa UUID (string).
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id }
    });

    // Se agrega verificación si no existe la incidencia.
    if (!incidencia) throw new NotFoundException(`Incidencia ${id} no encontrada`);

    return incidencia;
  }

  async update(id: string, updateIncidenciaDto: UpdateIncidenciaDto) {
    // Se actualiza directamente en BD usando el id tipo string (UUID).
    await this.incidenciaRepository.update(id, updateIncidenciaDto);

    // Se consulta nuevamente la incidencia actualizada.
    const updated = await this.incidenciaRepository.findOne({ where: { id } });

    // Misma validación: si no existe, se arroja excepción.
    if (!updated) throw new NotFoundException(`Incidencia ${id} no encontrada`);

    return updated;
  }

  // ✅ SOFT DELETE
  async remove(id: string) {
    // Se cambió delete() por softDelete() para habilitar borrado lógico.
    const result = await this.incidenciaRepository.softDelete(id);

    // SoftDelete devuelve ".affected", se valida que exista al menos una coincidencia.
    if (!result.affected) {
      throw new NotFoundException(`Incidencia ${id} no encontrada`);
    }

    return { message: `Incidencia ${id} desactivada` };
  }

  // ✅ RESTAURAR
  async restore(id: string) {
    // Se usa restore() propio del soft delete de TypeORM.
    await this.incidenciaRepository.restore(id);
    return { message: `Incidencia ${id} reactivada` };
  }
}
