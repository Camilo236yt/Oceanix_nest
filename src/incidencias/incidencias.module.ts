import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { IncidenciasController } from './incidencias.controller';
import { IncidenciasService } from './incidencias.service';
import { Incidencia } from './entities/incidencia.entity';
import { IncidentImage } from './entities/incident-image.entity';
import { StorageModule } from 'src/storage/storage.module';
import { EmployeeAssignmentService } from './services/employee-assignment.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Incidencia,
      IncidentImage,
      User,
      UserRole,
      Role,
    ]),
    StorageModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [IncidenciasController],
  providers: [IncidenciasService, EmployeeAssignmentService],
})
export class IncidenciasModule {}
