import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from '../seed/seed.service';
import { Logger } from '@nestjs/common';

/**
 * Script CLI para ejecutar las semillas de base de datos
 *
 * Uso: npm run seed
 */ 
async function bootstrap() {
  const logger = new Logger('SeedCLI');

  try {
    logger.log('Initializing NestJS application...');
    const app = await NestFactory.createApplicationContext(AppModule);

    const seedService = app.get(SeedService);

    logger.log('Running seeds...');
    await seedService.runAllSeeds();

    logger.log('Seeds completed successfully!');
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error running seeds:', error);
    process.exit(1);
  }
}

bootstrap();
