import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Incidencia } from '../incidencias/entities/incidencia.entity';
import { Enterprise } from '../enterprise/entities/enterprise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incidencia, Enterprise])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
