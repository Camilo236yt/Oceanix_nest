import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { IncidenciasController } from './incidencias.controller';
import { IncidenciasService } from './incidencias.service';
import { Incidencia } from './entities/incidencia.entity';
import { IncidentImage } from './entities/incident-image.entity';
import { StorageModule } from 'src/storage/storage.module';
import { EmployeeAssignmentService } from './services/employee-assignment.service';
import { IncidenciaMonitorService } from './services/incidencia-monitor.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { NotificationModule } from '../notification/notification.module';
import { MessagesModule } from '../messages/messages.module';

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
    NotificationModule,
    MessagesModule,
  ],
  controllers: [IncidenciasController],
  providers: [IncidenciasService, EmployeeAssignmentService, IncidenciaMonitorService],
})
export class IncidenciasModule {}
