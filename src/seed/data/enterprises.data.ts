/**
 * Datos de empresas para seed
 */
export interface EnterpriseData {
  name: string;
  subdomain: string;
  email: string;
  phone: string;
}

export const ENTERPRISES_DATA: EnterpriseData[] = [
  {
    name: 'TechCorp Solutions',
    subdomain: 'techcorp',
    email: 'contact@techcorp.com',
    phone: '+1234567890',
  },
  {
    name: 'Global Services Inc',
    subdomain: 'globalservices',
    email: 'info@globalservices.com',
    phone: '+1234567891',
  },
  {
    name: 'Innovation Labs',
    subdomain: 'innovationlabs',
    email: 'hello@innovationlabs.com',
    phone: '+1234567892',
  },
];
