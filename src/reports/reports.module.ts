import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Incidencia } from '../incidencias/entities/incidencia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incidencia])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
