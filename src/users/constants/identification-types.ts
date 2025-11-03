// Tipos de identificación para PERSONAS (Empleados, Clientes, Administradores)
export enum PersonalIdentificationType {
  CC = 'CC',           // Cédula de Ciudadanía (Colombia)
  CE = 'CE',           // Cédula de Extranjería (Colombia)
  TI = 'TI',           // Tarjeta de Identidad (Colombia)
  PASSPORT = 'PASSPORT', // Pasaporte
  DNI = 'DNI',         // Documento Nacional de Identidad (otros países)
}

// Tipos de identificación para EMPRESAS
export enum BusinessIdentificationType {
  NIT = 'NIT',         // Número de Identificación Tributaria (Colombia)
  RUC = 'RUC',         // Registro Único de Contribuyentes (Perú, Ecuador)
  RUT = 'RUT',         // Rol Único Tributario (Chile)
  CUIT = 'CUIT',       // Clave Única de Identificación Tributaria (Argentina)
}

export const PERSONAL_IDENTIFICATION_LABELS = {
  [PersonalIdentificationType.CC]: 'Cédula de Ciudadanía',
  [PersonalIdentificationType.CE]: 'Cédula de Extranjería',
  [PersonalIdentificationType.TI]: 'Tarjeta de Identidad',
  [PersonalIdentificationType.PASSPORT]: 'Pasaporte',
  [PersonalIdentificationType.DNI]: 'DNI',
} as const;

export const BUSINESS_IDENTIFICATION_LABELS = {
  [BusinessIdentificationType.NIT]: 'NIT',
  [BusinessIdentificationType.RUC]: 'RUC',
  [BusinessIdentificationType.RUT]: 'RUT',
  [BusinessIdentificationType.CUIT]: 'CUIT',
} as const;

// Helper para validar si un tipo de identificación es personal
export const isPersonalIdentification = (type: string): boolean => {
  return Object.values(PersonalIdentificationType).includes(type as PersonalIdentificationType);
};

// Helper para validar si un tipo de identificación es empresarial
export const isBusinessIdentification = (type: string): boolean => {
  return Object.values(BusinessIdentificationType).includes(type as BusinessIdentificationType);
};
