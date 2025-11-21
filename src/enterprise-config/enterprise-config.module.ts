import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterpriseConfigController } from './enterprise-config.controller';
import { EnterpriseConfigService } from './enterprise-config.service';
import { EnterpriseDocumentService } from './enterprise-document.service';
import { EnterpriseConfig } from './entities/enterprise-config.entity';
import { EnterpriseDocument } from './entities/enterprise-document.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnterpriseConfig, EnterpriseDocument]),
    StorageModule,
  ],
  controllers: [EnterpriseConfigController],
  providers: [EnterpriseConfigService, EnterpriseDocumentService],
  exports: [EnterpriseConfigService, EnterpriseDocumentService],
})
export class EnterpriseConfigModule {}
