import { Module } from '@nestjs/common';
import { IncidenciasService } from './incidencias.service';
import { IncidenciasController } from './incidencias.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incidencia } from './entities/incidencia.entity';

// TODO: Importar ScheduleModule para cronjobs (instalar: npm install @nestjs/schedule)
// TODO: Importar servicios de services/ cuando se creen
// TODO: Importar entidad IncidentImage cuando se cree
// TODO: Importar StorageModule para MinIO

@Module({
  imports: [TypeOrmModule.forFeature([Incidencia])],
  controllers: [IncidenciasController],
  providers: [IncidenciasService],
})
export class IncidenciasModule {}
