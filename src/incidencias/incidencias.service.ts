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
import { INCIDENCIA_CONFIG, INCIDENCIA_MESSAGES } from './constants';

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
  

  private getApiBaseUrl(): string {
    return (
      process.env.API_BASE_URL ||
      process.env.APP_URL ||
      `http://localhost:${process.env.PORT ?? 3000}`
    );
  }

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
   * Crea una incidencia con soporte para imágenes (máximo 5) y aislamiento por enterpriseId.
   */
  async create(
    createIncidenciaDto: CreateIncidenciaDto,
    enterpriseId?: string,
    createdByUserId?: string,
    images?: Express.Multer.File[],
  ) {
    if (!enterpriseId) {
      throw new BadRequestException(INCIDENCIA_MESSAGES.TENANT_REQUIRED);
    }

    if (!createdByUserId) {
      throw new BadRequestException(INCIDENCIA_MESSAGES.USER_REQUIRED);
    }

    if (images && images.length > INCIDENCIA_CONFIG.MAX_IMAGES) {
      throw new BadRequestException(INCIDENCIA_MESSAGES.MAX_IMAGES_EXCEEDED);
    }

    let savedIncidencia: Incidencia | null = null;

    try {
      // Obtener empleado con menor carga para asignación automática
      const assignedEmployeeId = await this.employeeAssignmentService.getEmployeeWithLeastWorkload(enterpriseId);

      const incidencia = this.incidenciaRepository.create({
        enterpriseId,
        status: IncidenciaStatus.PENDING,
        createdByUserId,
        assignedEmployeeId: assignedEmployeeId ?? undefined, // Asignación automática (puede ser undefined si no hay empleados disponibles)
        ...createIncidenciaDto,
      });

      savedIncidencia = await this.incidenciaRepository.save(incidencia) as Incidencia;
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

          const path = `${INCIDENCIA_CONFIG.STORAGE_PATH}/${enterpriseId}/${incidenciaRecord.id}`;
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
          const savedImages = await this.incidentImageRepository.save(imageEntities);
          const apiBaseUrl = this.getApiBaseUrl();

          for (const image of savedImages) {
            image.url = `${apiBaseUrl}/api/v1/incidencias/images/${image.id}`;
          }

          await this.incidentImageRepository.save(savedImages);

          incidenciaRecord.images = savedImages;
        }
      }

      return {
        ...incidenciaRecord,
        assignedEmployeeId,
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

  async getImage(imageId: string, incidenciaId: string, enterpriseId: string) {
    const incidentImage = await this.incidentImageRepository.findOne({
      where: { id: imageId },
      relations: ['incidencia'],
    });

    if (
      !incidentImage ||
      incidentImage.incidencia?.id !== incidenciaId ||
      incidentImage.incidencia?.enterpriseId !== enterpriseId
    ) {
      throw new NotFoundException(INCIDENCIA_MESSAGES.IMAGE_NOT_FOUND);
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

  async getImageById(imageId: string, enterpriseId: string) {
    const incidentImage = await this.incidentImageRepository.findOne({
      where: { id: imageId },
      relations: ['incidencia'],
    });

    if (!incidentImage || incidentImage.incidencia?.enterpriseId !== enterpriseId) {
      throw new NotFoundException(INCIDENCIA_MESSAGES.IMAGE_NOT_FOUND_TENANT);
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
  async findAll(enterpriseId: string) {
    return await this.incidenciaRepository.find({
      where: { enterpriseId },
    });
  }

  /**
   * Obtiene una incidencia específica, filtrando también por enterpriseId
   */
  async findOne(id: string, enterpriseId: string) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id, enterpriseId },
    });

    if (!incidencia) {
      throw new NotFoundException(INCIDENCIA_MESSAGES.NOT_FOUND);
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
    enterpriseId: string,
  ) {
    const incidencia = await this.findOne(id, enterpriseId);

    Object.assign(incidencia, updateIncidenciaDto);

    try {
      return await this.incidenciaRepository.save(incidencia);
    } catch (error) {
      this.handleDBError(error, 'actualizar la incidencia');
    }
  }

  /**
   * Soft delete con validación por empresa (enterpriseId)
   */
  async remove(id: string, enterpriseId: string) {
    const incidencia = await this.findOne(id, enterpriseId);

    const result = await this.incidenciaRepository.softDelete(incidencia.id);

    if (!result.affected) {
      throw new NotFoundException(INCIDENCIA_MESSAGES.NOT_FOUND);
    }

    return { message: INCIDENCIA_MESSAGES.DELETED_SUCCESSFULLY };
  }

  /**
   * Restaura incidencia (soft delete invertido)
   */
  async restore(id: string, enterpriseId: string) {
    const incidencia = await this.findOne(id, enterpriseId);

    await this.incidenciaRepository.restore(incidencia.id);
    return { message: INCIDENCIA_MESSAGES.RESTORED_SUCCESSFULLY };
  }

  async listImages(incidenciaId: string, enterpriseId: string) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id: incidenciaId, enterpriseId },
    });

    if (!incidencia) {
      throw new NotFoundException(INCIDENCIA_MESSAGES.NOT_FOUND);
    }

    const images = await this.incidentImageRepository.find({
      where: { incidenciaId },
      select: ['id', 'url', 'mimeType', 'originalName', 'incidenciaId'],
    });

    return {
      imageGroupId: incidenciaId,
      images,
    };
  }

  /**
   * Obtiene todas las incidencias creadas por un cliente específico
   */
  async findAllByClient(enterpriseId: string, clientUserId: string) {
    return await this.incidenciaRepository.find({
      where: { enterpriseId, createdByUserId: clientUserId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene una incidencia específica creada por el cliente
   */
  async findOneByClient(id: string, enterpriseId: string, clientUserId: string) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id, enterpriseId, createdByUserId: clientUserId },
    });

    if (!incidencia) {
      throw new NotFoundException(INCIDENCIA_MESSAGES.NOT_FOUND);
    }

    return incidencia;
  }
}

