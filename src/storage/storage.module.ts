import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService] // Exportado para inyección en otros módulos (IncidenciasService)
})
export class StorageModule {}
