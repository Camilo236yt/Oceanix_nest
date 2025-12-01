import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterpriseConfigController } from './enterprise-config.controller';
import { EnterpriseConfigService } from './enterprise-config.service';
import { EnterpriseDocumentService } from './enterprise-document.service';
import { EmailService } from './email.service';
import { EnterpriseConfig } from './entities/enterprise-config.entity';
import { EnterpriseDocument } from './entities/enterprise-document.entity';
import { User } from '../users/entities/user.entity';
import { StorageModule } from '../storage/storage.module';
import { RedisService } from '../redis/redis.service';
import { EnterpriseModule } from '../enterprise/enterprise.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnterpriseConfig, EnterpriseDocument, User]),
    StorageModule,
    EnterpriseModule, // Import to access ThumbnailService
  ],
  controllers: [EnterpriseConfigController],
  providers: [
    EnterpriseConfigService,
    EnterpriseDocumentService,
    EmailService,
    RedisService,
  ],
  exports: [EnterpriseConfigService, EnterpriseDocumentService],
})
export class EnterpriseConfigModule { }
