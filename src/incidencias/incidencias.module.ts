import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { IncidenciasController } from './incidencias.controller';
import { IncidenciasService } from './incidencias.service';
import { Incidencia } from './entities/incidencia.entity';
import { IncidentImage } from './entities/incident-image.entity';
import { ReopenRequest } from './entities/reopen-request.entity';
import { StorageModule } from 'src/storage/storage.module';
import { EmployeeAssignmentService } from './services/employee-assignment.service';
import { IncidenciaMonitorService } from './services/incidencia-monitor.service';
import { ReopenRequestsService } from './services/reopen-requests.service';
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
      ReopenRequest,
      User,
      UserRole,
      Role,
    ]),
    // Configurar Multer con límites apropiados para uploads de imágenes
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024,    // 50MB por archivo individual
        fieldSize: 50 * 1024 * 1024,   // 50MB para campos (crítico para evitar errores)
        files: 10,                      // Máximo 10 archivos por request
        fields: 50,                     // Máximo 50 campos de formulario
      },
    }),
    StorageModule,
    ScheduleModule.forRoot(),
    NotificationModule,
    MessagesModule,
  ],
  controllers: [IncidenciasController],
  providers: [
    IncidenciasService,
    EmployeeAssignmentService,
    IncidenciaMonitorService,
    ReopenRequestsService,
  ],
  exports: [ReopenRequestsService],
})
export class IncidenciasModule { }
