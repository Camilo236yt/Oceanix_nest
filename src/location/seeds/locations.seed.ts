import { DataSource } from 'typeorm';
import axios from 'axios';
import { gunzipSync } from 'zlib';
import { Country } from '../entities/country.entity';
import { State } from '../entities/state.entity';
import { City } from '../entities/city.entity';

const API_BASE_URL = 'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json';

interface ApiCountry {
  id: number;
  name: string;
  iso3: string;
  iso2: string;
  phonecode: string;
  capital: string;
  currency: string;
  region: string;
  subregion: string;
}

interface ApiState {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  state_code: string;
  type: string | null;
  latitude: string | null;
  longitude: string | null;
}

interface ApiCity {
  id: number;
  name: string;
  state_id: number;
  country_code: string;
  latitude: string | null;
  longitude: string | null;
}

/**
 * Seed completo de ubicaciones mundiales
 * Hace peticiones directas a la API de dr5hn (sin descargar archivos)
 */
export async function seedLocations(
  dataSource: DataSource,
  options?: {
    countries?: string[]; // ISO2 codes (ej: ['CO', 'US', 'MX'])
    includeCities?: boolean; // Por defecto false para que sea más rápido
    batchSize?: number;
  }
) {
  const {
    countries: specificCountries,
    includeCities = false,
    batchSize = 500,
  } = options || {};

  console.log('🌍 Iniciando seed de ubicaciones desde API...');
  console.log(`📡 Trayendo datos de: ${API_BASE_URL}`);

  const countryRepo = dataSource.getRepository(Country);
  const stateRepo = dataSource.getRepository(State);
  const cityRepo = dataSource.getRepository(City);

  // Mapas para relacionar IDs de la API con nuestros UUIDs
  const countryIdMap = new Map<number, string>();
  const stateIdMap = new Map<number, string>();

  await dataSource.transaction(async (manager) => {
    // 1. TRAER Y GUARDAR PAÍSES
    console.log('📦 Descargando países...');
    const countriesResponse = await axios.get<ApiCountry[]>(`${API_BASE_URL}/countries.json`);
    let countriesData = countriesResponse.data;

    // Filtrar por países específicos si se especifican
    if (specificCountries && specificCountries.length > 0) {
      countriesData = countriesData.filter(c => specificCountries.includes(c.iso2));
      console.log(`   Filtrando a ${countriesData.length} países específicos`);
    }

    console.log(`📊 Procesando ${countriesData.length} países...`);

    // Insertar países en lotes
    for (let i = 0; i < countriesData.length; i += batchSize) {
      const batch = countriesData.slice(i, i + batchSize);
      const countryEntities: Country[] = [];

      for (const apiCountry of batch) {
        // Verificar si ya existe
        const existing = await manager.findOne(Country, {
          where: { iso2: apiCountry.iso2 }
        });

        if (existing) {
          countryIdMap.set(apiCountry.id, existing.id);
          continue;
        }

        const country = manager.create(Country, {
          name: apiCountry.name,
          code: apiCountry.iso3,
          iso2: apiCountry.iso2,
          phoneCode: apiCountry.phonecode ? '+' + apiCountry.phonecode : undefined,
          currency: apiCountry.currency || undefined,
          capital: apiCountry.capital || undefined,
          region: apiCountry.region || 'Unknown',
          subregion: apiCountry.subregion || 'Unknown',
          isActive: true
        });

        countryEntities.push(country);
      }

      if (countryEntities.length > 0) {
        const savedCountries = await manager.save(Country, countryEntities);

        // Mapear IDs
        for (const country of savedCountries) {
          const originalData = batch.find(c => c.iso2 === country.iso2);
          if (originalData) {
            countryIdMap.set(originalData.id, country.id);
          }
        }

        console.log(`   ✅ Guardados ${savedCountries.length} países (${i + savedCountries.length}/${countriesData.length})`);
      }
    }

    // 2. TRAER Y GUARDAR ESTADOS/PROVINCIAS
    console.log('📦 Descargando estados/provincias...');
    const statesResponse = await axios.get<ApiState[]>(`${API_BASE_URL}/states.json`);
    let statesData = statesResponse.data;

    // Filtrar por países específicos
    if (specificCountries && specificCountries.length > 0) {
      statesData = statesData.filter(s => specificCountries.includes(s.country_code));
      console.log(`   Filtrando a ${statesData.length} estados para países específicos`);
    }

    console.log(`📊 Procesando ${statesData.length} estados...`);

    // Insertar estados en lotes
    for (let i = 0; i < statesData.length; i += batchSize) {
      const batch = statesData.slice(i, i + batchSize);
      const stateEntities: State[] = [];

      for (const apiState of batch) {
        const countryId = countryIdMap.get(apiState.country_id);

        if (!countryId) {
          continue; // País no existe en nuestra DB
        }

        // Verificar si ya existe
        const existing = await manager.findOne(State, {
          where: { name: apiState.name, countryId }
        });

        if (existing) {
          stateIdMap.set(apiState.id, existing.id);
          continue;
        }

        const state = manager.create(State, {
          name: apiState.name,
          code: apiState.state_code || undefined,
          type: apiState.type || 'State',
          countryId,
          latitude: apiState.latitude ? parseFloat(apiState.latitude) : undefined,
          longitude: apiState.longitude ? parseFloat(apiState.longitude) : undefined,
          isActive: true
        });

        stateEntities.push(state);
      }

      if (stateEntities.length > 0) {
        const savedStates = await manager.save(State, stateEntities);

        // Mapear IDs
        for (let j = 0; j < savedStates.length; j++) {
          const state = savedStates[j];
          const originalData = batch.find(s =>
            s.name === state.name &&
            countryIdMap.get(s.country_id) === state.countryId
          );
          if (originalData) {
            stateIdMap.set(originalData.id, state.id);
          }
        }

        console.log(`   ✅ Guardados ${savedStates.length} estados (${i + savedStates.length}/${statesData.length})`);
      }
    }

    // 3. TRAER Y GUARDAR CIUDADES (OPCIONAL)
    if (includeCities) {
      console.log('📦 Descargando ciudades (archivo comprimido)...');
      // Descargar y descomprimir cities.json.gz
      const citiesResponse = await axios.get(`${API_BASE_URL}/cities.json.gz`, {
        responseType: 'arraybuffer'
      });

      // Descomprimir el contenido gzip
      const decompressed = gunzipSync(Buffer.from(citiesResponse.data));
      let citiesData: ApiCity[] = JSON.parse(decompressed.toString('utf-8'));

      // Filtrar por países específicos
      if (specificCountries && specificCountries.length > 0) {
        citiesData = citiesData.filter(c => specificCountries.includes(c.country_code));
        console.log(`   Filtrando a ${citiesData.length} ciudades para países específicos`);
      }

      // Limitar a 50,000 ciudades para no saturar
      const maxCities = Math.min(citiesData.length, 50000);
      console.log(`📊 Procesando ${maxCities} ciudades...`);

      for (let i = 0; i < maxCities; i += batchSize) {
        const batch = citiesData.slice(i, Math.min(i + batchSize, maxCities));
        const cityEntities: City[] = [];

        for (const apiCity of batch) {
          const stateId = stateIdMap.get(apiCity.state_id);

          if (!stateId) {
            continue; // Estado no existe en nuestra DB
          }

          // Verificar si ya existe
          const existing = await manager.findOne(City, {
            where: { name: apiCity.name, stateId }
          });

          if (existing) {
            continue;
          }

          const city = manager.create(City, {
            name: apiCity.name,
            stateId,
            latitude: apiCity.latitude ? parseFloat(apiCity.latitude) : undefined,
            longitude: apiCity.longitude ? parseFloat(apiCity.longitude) : undefined,
            isActive: true
          });

          cityEntities.push(city);
        }

        if (cityEntities.length > 0) {
          // Usar insert para mejor rendimiento
          await manager
            .createQueryBuilder()
            .insert()
            .into(City)
            .values(cityEntities)
            .orIgnore()
            .execute();

          console.log(`   ✅ Guardadas ${cityEntities.length} ciudades (${Math.min(i + batchSize, maxCities)}/${maxCities})`);
        }
      }
    }
  });

  // Resumen final
  const countryCount = await countryRepo.count();
  const stateCount = await stateRepo.count();
  const cityCount = await cityRepo.count();

  console.log('\n📊 Resumen del Seed:');
  console.log(`   • Países: ${countryCount}`);
  console.log(`   • Estados/Provincias: ${stateCount}`);
  console.log(`   • Ciudades: ${cityCount}`);
  console.log('✅ ¡Seed completado exitosamente!');
}