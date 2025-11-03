import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { seedLocations } from '../seeds/locations.seed';

interface SeedLocationOptions {
  countries?: string;
  withCities?: boolean;
}

@Injectable()
@Command({
  name: 'seed:locations',
  description: 'Seed world location data (countries, states, cities)',
})
export class SeedLocationsCommand extends CommandRunner {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async run(
    passedParam: string[],
    options: SeedLocationOptions,
  ): Promise<void> {
    try {
      const countryCodes = options.countries
        ? options.countries.split(',').map(c => c.trim().toUpperCase())
        : undefined;

      await seedLocations(this.dataSource, {
        countries: countryCodes,
        includeCities: options.withCities === true,
        batchSize: 500,
      });
    } catch (error) {
      console.error('❌ Error en seed:', error);
      process.exit(1);
    }
  }

  @Option({
    flags: '-c, --countries <countries>',
    description: 'Países específicos separados por comas (ej: "CO,US,MX"). Si no se especifica, carga TODOS los países.',
  })
  parseCountries(val: string): string {
    return val;
  }

  @Option({
    flags: '--with-cities',
    description: 'Incluir ciudades (por defecto solo países y estados)',
  })
  parseWithCities(): boolean {
    return true;
  }
}