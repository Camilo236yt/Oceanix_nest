import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { EnterpriseService } from './enterprise.service';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';

@ApiTags('Enterprise')
@Controller('enterprise')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva empresa',
    description: 'Crea una nueva empresa en el sistema. Valida que el nombre y subdominio sean únicos.'
  })
  @ApiBody({
    type: CreateEnterpriseDto,
    examples: {
      example1: {
        summary: 'Empresa completa',
        value: {
          name: 'Acme Corporation',
          subdomain: 'acme',
          email: 'contacto@acme.com',
          phone: '+573001234567',
          addressId: '550e8400-e29b-41d4-a716-446655440003',
          taxIdType: 'NIT',
          taxIdNumber: '900123456-7',
          logo: 'https://example.com/logo.png'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Empresa creada exitosamente',
    schema: {
      example: {
        id: '3fd85f64-5717-4562-b3fc-2c963f66afa6',
        name: 'Acme Corporation',
        subdomain: 'acme',
        email: 'contacto@acme.com',
        phone: '+573001234567',
        addressId: '550e8400-e29b-41d4-a716-446655440003',
        taxIdType: 'NIT',
        taxIdNumber: '900123456-7',
        logo: 'https://example.com/logo.png',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Error de validación - Nombre o subdominio ya existe' })
  create(@Body() createEnterpriseDto: CreateEnterpriseDto) {
    return this.enterpriseService.create(createEnterpriseDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las empresas',
    description: 'Retorna una lista de todas las empresas. Opcionalmente puede incluir relaciones con usuarios y roles.'
  })
  @ApiQuery({
    name: 'includeRelations',
    required: false,
    type: Boolean,
    description: 'Incluir usuarios y roles relacionados',
    example: false
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas obtenida exitosamente',
    schema: {
      example: [
        {
          id: '3fd85f64-5717-4562-b3fc-2c963f66afa6',
          name: 'Acme Corporation',
          subdomain: 'acme',
          email: 'contacto@acme.com',
          phone: '+573001234567',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ]
    }
  })
  findAll(@Query('includeRelations') includeRelations?: boolean) {
    return this.enterpriseService.findAll(includeRelations);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener empresa por ID',
    description: 'Retorna los detalles de una empresa específica incluyendo usuarios y roles relacionados'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la empresa',
    example: '3fd85f64-5717-4562-b3fc-2c963f66afa6'
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la empresa obtenidos exitosamente',
    schema: {
      example: {
        id: '3fd85f64-5717-4562-b3fc-2c963f66afa6',
        name: 'Acme Corporation',
        subdomain: 'acme',
        email: 'contacto@acme.com',
        phone: '+573001234567',
        addressId: '550e8400-e29b-41d4-a716-446655440003',
        address: {
          id: '550e8400-e29b-41d4-a716-446655440003',
          streetAddress: 'Calle 100 #15-20',
          city: { name: 'Bogotá' }
        },
        taxIdType: 'NIT',
        taxIdNumber: '900123456-7',
        logo: 'https://example.com/logo.png',
        isActive: true,
        users: [],
        roles: []
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  findOne(@Param('id') id: string) {
    return this.enterpriseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una empresa',
    description: 'Actualiza la información de una empresa. Valida que el nuevo nombre o subdominio sean únicos si se están cambiando.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la empresa',
    example: '3fd85f64-5717-4562-b3fc-2c963f66afa6'
  })
  @ApiBody({
    type: UpdateEnterpriseDto,
    examples: {
      example1: {
        summary: 'Actualizar información básica',
        value: {
          email: 'nuevo@acme.com',
          phone: '+573009876543'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa actualizada exitosamente'
  })
  @ApiResponse({ status: 400, description: 'Error de validación - Nombre o subdominio ya existe' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  update(@Param('id') id: string, @Body() updateEnterpriseDto: UpdateEnterpriseDto) {
    return this.enterpriseService.update(id, updateEnterpriseDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una empresa (soft delete)',
    description: 'Desactiva una empresa estableciendo isActive en false. La empresa permanece en la base de datos pero no estará accesible.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la empresa',
    example: '3fd85f64-5717-4562-b3fc-2c963f66afa6'
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa desactivada exitosamente',
    schema: {
      example: {
        message: 'Empresa desactivada exitosamente'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  remove(@Param('id') id: string) {
    return this.enterpriseService.remove(id);
  }
}
