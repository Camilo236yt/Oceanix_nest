import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterpriseService } from './enterprise.service';
import { EnterpriseController } from './enterprise.controller';
import { Enterprise } from './entities/enterprise.entity';
import { ThumbnailService } from './services/thumbnail.service';

@Module({
  controllers: [EnterpriseController],
  providers: [EnterpriseService, ThumbnailService],
  imports: [TypeOrmModule.forFeature([Enterprise])],
  exports: [EnterpriseService, ThumbnailService],
})
export class EnterpriseModule { }
