import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Express } from 'express';

import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import { Incidencia } from './entities/incidencia.entity';
import { IncidentImage } from './entities/incident-image.entity';
import { StorageService } from 'src/storage/storage.service';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZES, STORAGE_BUCKETS } from 'src/storage/config/storage.config';
import { EmployeeAssignmentService } from './services/employee-assignment.service';
import { IncidenciaStatus } from './enums/incidencia.enums';

@Injectable()
export class IncidenciasService {
  constructor(
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
    @InjectRepository(IncidentImage)
    private readonly incidentImageRepository: Repository<IncidentImage>,
    private readonly storageService: StorageService,
    private readonly employeeAssignmentService: EmployeeAssignmentService,
  ) {}

  /**
   * Método auxiliar centralizado para manejar errores de base de datos
   * Se usa en create() y update() para evitar duplicar lógica.
   */
  private handleDBError(error: any, context: string) {
    if (error?.code === '23505') {
      throw new ConflictException(`Error: registro duplicado (${context})`);
    }
    throw new InternalServerErrorException(`Error al ${context}: ${error?.message ?? 'unknown'}`);
  }

  /**
   * Crea una incidencia con soporte para imágenes (máximo 5) y aislamiento por tenantId.
   */
  async create(
    createIncidenciaDto: CreateIncidenciaDto,
    tenantId?: string,
    createdByUserId?: string,
    images?: Express.Multer.File[],
  ) {
    if (!tenantId) {
      throw new BadRequestException('tenantId es requerido para crear incidencias');
    }

    if (!createdByUserId) {
      throw new BadRequestException('userId es requerido para crear incidencias');
    }

    if (images && images.length > 5) {
      throw new BadRequestException('Máximo 5 imágenes permitidas');
    }

    let savedIncidencia: Incidencia | null = null;

    try {
      const incidencia = this.incidenciaRepository.create({
        tenantId,
        status: IncidenciaStatus.PENDING,
        createdByUserId,
        ...createIncidenciaDto,
      });

      savedIncidencia = await this.incidenciaRepository.save(incidencia);
      const incidenciaRecord = await this.incidenciaRepository.findOne({
        where: { id: savedIncidencia.id },
        relations: ['images'],
      });

      if (!incidenciaRecord) {
        throw new InternalServerErrorException('No se pudo recuperar la incidencia creada');
      }

      // Subir imágenes a MinIO y guardar URLs
      if (images && images.length) {
        const uploadedFiles: { url: string; key: string; mimeType: string; originalName: string }[] = [];
        for (const file of images) {
          this.storageService.validateFileType(file, [...ALLOWED_FILE_TYPES.IMAGES]);
          this.storageService.validateFileSize(file, MAX_FILE_SIZES.IMAGE);

          const path = `incidencias/${tenantId}/${incidenciaRecord.id}`;
          const { url, key } = await this.storageService.uploadFile(
            file,
            STORAGE_BUCKETS.TICKETS,
            path,
          );
          uploadedFiles.push({
            url,
            key,
            mimeType: file.mimetype,
            originalName: file.originalname,
          });
        }

        if (uploadedFiles.length) {
          const imageEntities = uploadedFiles.map((fileMeta) =>
            this.incidentImageRepository.create({
              url: fileMeta.url,
              key: fileMeta.key,
              mimeType: fileMeta.mimeType,
              originalName: fileMeta.originalName,
              incidencia: incidenciaRecord,
              incidenciaId: incidenciaRecord.id,
            })
          );
          await this.incidentImageRepository.save(imageEntities);

          incidenciaRecord.images = await this.incidentImageRepository.find({
            where: { incidencia: { id: incidenciaRecord.id } },
          });
        }
      }

      // Asignación automática (no bloqueante)
      try {
        await (this.employeeAssignmentService as any)?.assignAutomatically?.(incidenciaRecord, tenantId);
      } catch {
        // Silenciar errores de asignación para no bloquear la creación
      }

      return {
        ...incidenciaRecord,
        imageGroupId: incidenciaRecord.id,
      };
    } catch (error) {
      if (savedIncidencia?.id) {
        await this.incidenciaRepository.delete(savedIncidencia.id);
      }

      if (error?.code) {
        this.handleDBError(error, 'crear la incidencia');
      }

      throw new InternalServerErrorException(`Error al crear la incidencia: ${error.message}`);
    }
  }

  async getImage(imageId: string, incidenciaId: string, tenantId: string) {
    const incidentImage = await this.incidentImageRepository.findOne({
      where: { id: imageId },
      relations: ['incidencia'],
    });

    if (
      !incidentImage ||
      incidentImage.incidencia?.id !== incidenciaId ||
      incidentImage.incidencia?.tenantId !== tenantId
    ) {
      throw new NotFoundException('Imagen no encontrada para esta incidencia');
    }

    const data = await this.storageService.getFile(
      STORAGE_BUCKETS.TICKETS,
      incidentImage.key,
    );

    return {
      data,
      mimeType: incidentImage.mimeType,
      originalName: incidentImage.originalName,
    };
  }

  /**
   * Filtra incidencias por empresa (tenant)
   */
  async findAll(tenantId: string) {
    return await this.incidenciaRepository.find({
      where: { tenantId },
    });
  }

  /**
   * Obtiene una incidencia específica, filtrando también por tenantId
   */
  async findOne(id: string, tenantId: string) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id, tenantId },
    });

    if (!incidencia) {
      throw new NotFoundException(`Incidencia ${id} no encontrada`);
    }

    return incidencia;
  }

  /**
   * Antes de actualizar valida que exista (reutiliza findOne)
   * Manejo de errores con handleDBError()
   */
  async update(
    id: string,
    updateIncidenciaDto: UpdateIncidenciaDto,
    tenantId: string,
  ) {
    const incidencia = await this.findOne(id, tenantId);

    Object.assign(incidencia, updateIncidenciaDto);

    try {
      return await this.incidenciaRepository.save(incidencia);
    } catch (error) {
      this.handleDBError(error, 'actualizar la incidencia');
    }
  }

  /**
   * Soft delete con validación por empresa (tenantId)
   */
  async remove(id: string, tenantId: string) {
    const incidencia = await this.findOne(id, tenantId);

    const result = await this.incidenciaRepository.softDelete(incidencia.id);

    if (!result.affected) {
      throw new NotFoundException(`Incidencia ${id} no encontrada`);
    }

    return { message: `Incidencia ${id} desactivada` };
  }

  /**
   * Restaura incidencia (soft delete invertido)
   */
  async restore(id: string, tenantId: string) {
    const incidencia = await this.findOne(id, tenantId);

    await this.incidenciaRepository.restore(incidencia.id);
    return { message: `Incidencia ${id} reactivada` };
  }

  async listImages(incidenciaId: string, tenantId: string) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: incidenciaId, tenantId },
    });

    if (!incidencia) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    const images = await this.incidentImageRepository.find({
      where: { incidencia: { id: incidenciaId } },
      select: ['id', 'url', 'mimeType', 'originalName', 'incidenciaId'],
    });

    return {
      imageGroupId: incidenciaId,
      images,
    };
  }
}

