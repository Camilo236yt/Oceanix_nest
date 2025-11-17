import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Incidencia } from './entities/incidencia.entity';
import { Repository } from 'typeorm';

// TODO: Inyectar servicio de asignación de empleados (crear en carpeta services/)
// TODO: Inyectar servicio de Storage para subir imágenes a MinIO

@Injectable()
export class IncidenciasService {
  constructor(
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
  ) {}

  /**
   * ✅ Método auxiliar centralizado para manejar errores de base de datos
   * Se usa en create() y update() para evitar duplicar lógica.
   */
  private handleDBError(error: any, context: string) {
    // Violación de clave única (ej: referencia duplicada)
    if (error.code === '23505') {
      throw new ConflictException(`Error: registro duplicado (${context})`);
    }
    // Otros errores de base de datos
    throw new InternalServerErrorException(`Error al ${context}: ${error.message}`);
  }

  /**
   * ✅ Crea una incidencia y maneja errores con try/catch
   */
  async create(createIncidenciaDto: CreateIncidenciaDto) {
    // TODO: Recibir enterpriseId y array de imágenes como parámetros
    // TODO: Reemplazar tenantId quemado por enterpriseId del parámetro
    const tenantId = 'obtenido-del-contexto-de-multi-tenancy'; // 🔹 Simulado

    // TODO: Validar máximo 5 imágenes y subirlas a MinIO
    // TODO: Guardar URLs de imágenes en entidad IncidentImage (crear archivo de entidad)

    try {
      const incidencia = this.incidenciaRepository.create({
        tenantId,
        ...createIncidenciaDto,
      });

      const savedIncidencia = await this.incidenciaRepository.save(incidencia);

      // TODO: Llamar servicio de asignación para asignar empleado automáticamente

      return savedIncidencia;
    } catch (error) {
      this.handleDBError(error, 'crear la incidencia');
    }
  }

  /**
   * ✅ Filtra incidencias por empresa (tenant)
   */
  async findAll(tenantId: string) {
    // 🔹 Cumple con la condición: "filtrar por empresa para no revolver todas"
    return await this.incidenciaRepository.find({
      where: { tenantId },
    });
  }

  /**
   * ✅ Obtiene una incidencia específica, filtrando también por tenantId
   */
  async findOne(id: string, tenantId: string) {
    // 🔹 Filtro por tenantId agregado correctamente
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id, tenantId },
    });

    if (!incidencia) {
      throw new NotFoundException(`Incidencia ${id} no encontrada`);
    }

    return incidencia;
  }

  /**
   * ✅ Antes de actualizar valida que exista (reutiliza findOne)
   * ✅ Manejo de errores con handleDBError()
   */
  async update(
    id: string,
    updateIncidenciaDto: UpdateIncidenciaDto,
    tenantId: string,
  ) {
    // Validar existencia (reutiliza findOne)
    const incidencia = await this.findOne(id, tenantId);

    Object.assign(incidencia, updateIncidenciaDto);

    try {
      return await this.incidenciaRepository.save(incidencia);
    } catch (error) {
      this.handleDBError(error, 'actualizar la incidencia');
    }
  }

  /**
   * ✅ Soft delete con validación por empresa (tenantId)
   */
  async remove(id: string, tenantId: string) {
    const incidencia = await this.findOne(id, tenantId); // Validación previa

    const result = await this.incidenciaRepository.softDelete(incidencia.id);

    if (!result.affected) {
      throw new NotFoundException(`Incidencia ${id} no encontrada`);
    }

    return { message: `Incidencia ${id} desactivada` };
  }

  /**
   * ✅ Restaura incidencia (soft delete invertido)
   */
  async restore(id: string, tenantId: string) {
    const incidencia = await this.findOne(id, tenantId); // Reutiliza validación

    await this.incidenciaRepository.restore(incidencia.id);
    return { message: `Incidencia ${id} reactivada` };
  }
}
