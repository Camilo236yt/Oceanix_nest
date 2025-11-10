import { Module } from '@nestjs/common';
import { DokployService } from './dokploy.service';

@Module({
  providers: [DokployService],
  exports: [DokployService],
})
export class DokployModule {}
