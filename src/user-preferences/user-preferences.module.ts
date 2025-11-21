import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreferencesController } from './user-preferences.controller';
import { NotificationProviderPreference } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationProviderPreference]),
  ],
  controllers: [UserPreferencesController],
  providers: [UserPreferencesService],
  exports: [UserPreferencesService], // Para que NotificationModule pueda usarlo
})
export class UserPreferencesModule {}
