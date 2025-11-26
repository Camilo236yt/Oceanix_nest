import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterpriseConfigController } from './enterprise-config.controller';
import { EnterpriseConfigService } from './enterprise-config.service';
import { EnterpriseDocumentService } from './enterprise-document.service';
import { EmailService } from './email.service';
import { EnterpriseConfig } from './entities/enterprise-config.entity';
import { EnterpriseDocument } from './entities/enterprise-document.entity';
import { StorageModule } from '../storage/storage.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnterpriseConfig, EnterpriseDocument]),
    StorageModule,
    RedisModule,
  ],
  controllers: [EnterpriseConfigController],
  providers: [
    EnterpriseConfigService,
    EnterpriseDocumentService,
    EmailService,
  ],
  exports: [EnterpriseConfigService, EnterpriseDocumentService],
})
export class EnterpriseConfigModule { }
