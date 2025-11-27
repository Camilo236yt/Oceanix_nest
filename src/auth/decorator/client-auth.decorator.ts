import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ClientAuthGuard } from '../guards/client-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';

/**
 * Decorator para endpoints exclusivos de clientes
 * Combina autenticación JWT + verificación de userType=CLIENT + validación de Tenant
 * No requiere permisos, solo que sea un cliente autenticado en el tenant correcto
 */
export function ClientAuth() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, ClientAuthGuard, TenantGuard),
    ApiBearerAuth(),
  );
}
