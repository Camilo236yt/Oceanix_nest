import { DataSource } from 'typeorm';
import { Country } from '../entities/country.entity';
import { State } from '../entities/state.entity';
import { City } from '../entities/city.entity';

export async function seedColombiaLocations(dataSource: DataSource) {
  const countryRepo = dataSource.getRepository(Country);
  const stateRepo = dataSource.getRepository(State);
  const cityRepo = dataSource.getRepository(City);

  // Create Colombia
  const colombia = await countryRepo.save({
    name: 'Colombia',
    code: 'COL',
    iso2: 'CO',
    phoneCode: '+57',
    currency: 'COP',
    capital: 'Bogotá D.C.',
    region: 'Americas',
    subregion: 'South America',
    isActive: true
  });

  // Create main departments (states)
  const departments = [
    { name: 'Cundinamarca', code: 'CUN', capital: 'Bogotá D.C.', type: 'Departamento' },
    { name: 'Antioquia', code: 'ANT', capital: 'Medellín', type: 'Departamento' },
    { name: 'Valle del Cauca', code: 'VAL', capital: 'Cali', type: 'Departamento' },
    { name: 'Atlántico', code: 'ATL', capital: 'Barranquilla', type: 'Departamento' },
    { name: 'Bolívar', code: 'BOL', capital: 'Cartagena', type: 'Departamento' },
    { name: 'Santander', code: 'SAN', capital: 'Bucaramanga', type: 'Departamento' },
    { name: 'Norte de Santander', code: 'NSA', capital: 'Cúcuta', type: 'Departamento' },
    { name: 'Tolima', code: 'TOL', capital: 'Ibagué', type: 'Departamento' },
    { name: 'Risaralda', code: 'RIS', capital: 'Pereira', type: 'Departamento' },
    { name: 'Caldas', code: 'CAL', capital: 'Manizales', type: 'Departamento' },
    { name: 'Boyacá', code: 'BOY', capital: 'Tunja', type: 'Departamento' },
    { name: 'Magdalena', code: 'MAG', capital: 'Santa Marta', type: 'Departamento' },
    { name: 'Córdoba', code: 'COR', capital: 'Montería', type: 'Departamento' },
    { name: 'Nariño', code: 'NAR', capital: 'Pasto', type: 'Departamento' },
    { name: 'Huila', code: 'HUI', capital: 'Neiva', type: 'Departamento' },
    { name: 'Quindío', code: 'QUI', capital: 'Armenia', type: 'Departamento' },
    { name: 'Meta', code: 'MET', capital: 'Villavicencio', type: 'Departamento' },
    { name: 'Cesar', code: 'CES', capital: 'Valledupar', type: 'Departamento' },
    { name: 'Cauca', code: 'CAU', capital: 'Popayán', type: 'Departamento' },
    { name: 'Sucre', code: 'SUC', capital: 'Sincelejo', type: 'Departamento' },
    { name: 'La Guajira', code: 'LAG', capital: 'Riohacha', type: 'Departamento' },
    { name: 'Casanare', code: 'CAS', capital: 'Yopal', type: 'Departamento' },
    { name: 'Chocó', code: 'CHO', capital: 'Quibdó', type: 'Departamento' },
    { name: 'Caquetá', code: 'CAQ', capital: 'Florencia', type: 'Departamento' },
    { name: 'Arauca', code: 'ARA', capital: 'Arauca', type: 'Departamento' },
    { name: 'Putumayo', code: 'PUT', capital: 'Mocoa', type: 'Departamento' },
    { name: 'Amazonas', code: 'AMA', capital: 'Leticia', type: 'Departamento' },
    { name: 'San Andrés y Providencia', code: 'SAP', capital: 'San Andrés', type: 'Departamento' },
    { name: 'Guaviare', code: 'GUA', capital: 'San José del Guaviare', type: 'Departamento' },
    { name: 'Guainía', code: 'GNA', capital: 'Inírida', type: 'Departamento' },
    { name: 'Vaupés', code: 'VAU', capital: 'Mitú', type: 'Departamento' },
    { name: 'Vichada', code: 'VID', capital: 'Puerto Carreño', type: 'Departamento' },
  ];

  const savedDepartments = new Map<string, State>();

  for (const dept of departments) {
    const savedDept = await stateRepo.save({
      ...dept,
      countryId: colombia.id,
      isActive: true
    });
    savedDepartments.set(dept.name, savedDept);
  }

  // Create main cities for key departments
  const cities = [
    // Cundinamarca
    { name: 'Bogotá D.C.', state: 'Cundinamarca', postalCode: '110111', areaCode: '1', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Soacha', state: 'Cundinamarca', postalCode: '250051', areaCode: '1', timezone: 'America/Bogota' },
    { name: 'Chía', state: 'Cundinamarca', postalCode: '250001', areaCode: '1', timezone: 'America/Bogota' },
    { name: 'Zipaquirá', state: 'Cundinamarca', postalCode: '250251', areaCode: '1', timezone: 'America/Bogota' },
    { name: 'Fusagasugá', state: 'Cundinamarca', postalCode: '252211', areaCode: '1', timezone: 'America/Bogota' },

    // Antioquia
    { name: 'Medellín', state: 'Antioquia', postalCode: '050001', areaCode: '4', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Bello', state: 'Antioquia', postalCode: '051050', areaCode: '4', timezone: 'America/Bogota' },
    { name: 'Itagüí', state: 'Antioquia', postalCode: '055410', areaCode: '4', timezone: 'America/Bogota' },
    { name: 'Envigado', state: 'Antioquia', postalCode: '055420', areaCode: '4', timezone: 'America/Bogota' },
    { name: 'Rionegro', state: 'Antioquia', postalCode: '054040', areaCode: '4', timezone: 'America/Bogota' },

    // Valle del Cauca
    { name: 'Cali', state: 'Valle del Cauca', postalCode: '760001', areaCode: '2', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Palmira', state: 'Valle del Cauca', postalCode: '763001', areaCode: '2', timezone: 'America/Bogota' },
    { name: 'Buenaventura', state: 'Valle del Cauca', postalCode: '764001', areaCode: '2', timezone: 'America/Bogota' },
    { name: 'Tuluá', state: 'Valle del Cauca', postalCode: '763021', areaCode: '2', timezone: 'America/Bogota' },
    { name: 'Jamundí', state: 'Valle del Cauca', postalCode: '764001', areaCode: '2', timezone: 'America/Bogota' },

    // Atlántico
    { name: 'Barranquilla', state: 'Atlántico', postalCode: '080001', areaCode: '5', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Soledad', state: 'Atlántico', postalCode: '083010', areaCode: '5', timezone: 'America/Bogota' },
    { name: 'Malambo', state: 'Atlántico', postalCode: '083001', areaCode: '5', timezone: 'America/Bogota' },

    // Bolívar
    { name: 'Cartagena', state: 'Bolívar', postalCode: '130001', areaCode: '5', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Turbaco', state: 'Bolívar', postalCode: '131001', areaCode: '5', timezone: 'America/Bogota' },
    { name: 'Magangué', state: 'Bolívar', postalCode: '132001', areaCode: '5', timezone: 'America/Bogota' },

    // Santander
    { name: 'Bucaramanga', state: 'Santander', postalCode: '680001', areaCode: '7', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Floridablanca', state: 'Santander', postalCode: '681001', areaCode: '7', timezone: 'America/Bogota' },
    { name: 'Girón', state: 'Santander', postalCode: '683001', areaCode: '7', timezone: 'America/Bogota' },
    { name: 'Piedecuesta', state: 'Santander', postalCode: '681011', areaCode: '7', timezone: 'America/Bogota' },
    { name: 'Barrancabermeja', state: 'Santander', postalCode: '687001', areaCode: '7', timezone: 'America/Bogota' },

    // Norte de Santander
    { name: 'Cúcuta', state: 'Norte de Santander', postalCode: '540001', areaCode: '7', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Villa del Rosario', state: 'Norte de Santander', postalCode: '544001', areaCode: '7', timezone: 'America/Bogota' },
    { name: 'Ocaña', state: 'Norte de Santander', postalCode: '546551', areaCode: '7', timezone: 'America/Bogota' },

    // Other capitals
    { name: 'Ibagué', state: 'Tolima', postalCode: '730001', areaCode: '8', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Pereira', state: 'Risaralda', postalCode: '660001', areaCode: '6', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Manizales', state: 'Caldas', postalCode: '170001', areaCode: '6', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Armenia', state: 'Quindío', postalCode: '630001', areaCode: '6', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Villavicencio', state: 'Meta', postalCode: '500001', areaCode: '8', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Pasto', state: 'Nariño', postalCode: '520001', areaCode: '2', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Neiva', state: 'Huila', postalCode: '410001', areaCode: '8', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Santa Marta', state: 'Magdalena', postalCode: '470001', areaCode: '5', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Montería', state: 'Córdoba', postalCode: '230001', areaCode: '4', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Valledupar', state: 'Cesar', postalCode: '200001', areaCode: '5', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Popayán', state: 'Cauca', postalCode: '190001', areaCode: '2', isCapital: true, timezone: 'America/Bogota' },
    { name: 'Tunja', state: 'Boyacá', postalCode: '150001', areaCode: '8', isCapital: true, timezone: 'America/Bogota' },
  ];

  for (const city of cities) {
    const state = savedDepartments.get(city.state);
    if (state) {
      await cityRepo.save({
        name: city.name,
        stateId: state.id,
        postalCode: city.postalCode,
        areaCode: city.areaCode,
        isCapital: city.isCapital || false,
        timezone: city.timezone,
        isActive: true
      });
    }
  }

  console.log('Colombia locations seeded successfully');
}