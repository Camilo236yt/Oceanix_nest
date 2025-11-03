import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterpriseService } from './enterprise.service';
import { EnterpriseController } from './enterprise.controller';
import { Enterprise } from './entities/enterprise.entity';

@Module({
  controllers: [EnterpriseController],
  providers: [EnterpriseService],
  imports: [TypeOrmModule.forFeature([Enterprise])],
  exports: [EnterpriseService],
})
export class EnterpriseModule {}
