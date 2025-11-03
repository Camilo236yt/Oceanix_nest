import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { Country, State, City, Address } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Country, State, City, Address])
  ],
  providers: [LocationService],
  controllers: [LocationController],
  exports: [LocationService, TypeOrmModule]
})
export class LocationModule {}
