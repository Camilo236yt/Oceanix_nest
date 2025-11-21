import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ClientAuthGuard } from '../guards/client-auth.guard';

/**
 * Decorator para endpoints exclusivos de clientes
 * Combina autenticación JWT + verificación de userType=CLIENT
 * No requiere permisos, solo que sea un cliente autenticado
 */
export function ClientAuth() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, ClientAuthGuard),
    ApiBearerAuth(),
  );
}
