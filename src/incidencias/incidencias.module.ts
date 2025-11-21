import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { IncidenciasController } from './incidencias.controller';
import { IncidenciasService } from './incidencias.service';
import { Incidencia } from './entities/incidencia.entity';
import { IncidentImage } from './entities/incident-image.entity';
import { StorageModule } from 'src/storage/storage.module';
import { EmployeeAssignmentService } from './services/employee-assignment.service';

// Cambios aplicados:
// - Importado ScheduleModule para futuros cronjobs.
// - Importado StorageModule para integración con MinIO.
// - Registrada la entidad IncidentImage en TypeORM.
// - Agregado EmployeeAssignmentService a providers.

@Module({
  imports: [
    TypeOrmModule.forFeature([Incidencia, IncidentImage]), // + IncidentImage
    StorageModule, // MinIO
    ScheduleModule.forRoot(), // habilita cronjobs
  ],
  controllers: [IncidenciasController],
  providers: [IncidenciasService, EmployeeAssignmentService], // + EmployeeAssignmentService
})
export class IncidenciasModule {}
