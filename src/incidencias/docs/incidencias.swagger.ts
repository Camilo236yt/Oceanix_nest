import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { CreateIncidenciaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from '../dto/update-incidencia.dto';
import { TipoIncidencia } from '../enums/incidencia.enums';

export const IncidenciasApiTags = () => ApiTags('Incidencias');

export const CreateIncidenciaDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiConsumes('multipart/form-data'),
    ApiOperation({
      summary: 'Crear incidencia',
      description:
        'Crea una incidencia para la empresa del usuario autenticado. Acepta hasta 5 imágenes en el campo `images`.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 3, example: 'Fuga en piso 3' },
          description: {
            type: 'string',
            example: 'Se detectó fuga en el baño principal',
          },
          ProducReferenceId: {
            type: 'string',
            example: 'INC-123456789',
            description: 'Identificador de la incidencia (debe ser único por empresa)',
          },
          tipo: {
            type: 'string',
            enum: Object.values(TipoIncidencia),
            example: TipoIncidencia.POR_DANO,
          },
          images: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
          },
        },
        required: ['name', 'description', 'tipo', 'ProducReferenceId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Incidencia creada',
      schema: {
        example: {
          id: '0a996172-9b0f-45f6-879f-51e9f08de111',
          name: 'Fuga en piso 3',
          description: 'Se detectó fuga en el baño principal',
          tipo: 'por_dano',
          status: 'PENDING',
          ProducReferenceId: 'INC-123456789',
          createdAt: '2025-11-18T09:21:15.988Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validación fallida o más de 5 imágenes',
    }),
    ApiResponse({
      status: 403,
      description: 'El usuario no tiene permisos para crear incidencias',
    }),
  );

export const FindAllIncidenciasDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Listar incidencias',
      description:
        'Retorna todas las incidencias de la empresa del usuario autenticado.',
    }),
    ApiResponse({
      status: 200,
      description: 'Listado de incidencias',
      schema: {
        example: [
          {
            id: '0a996172-9b0f-45f6-879f-51e9f08de111',
            name: 'Fuga en piso 3',
            tipo: 'por_dano',
            status: 'PENDING',
            createdAt: '2025-11-18T09:21:15.988Z',
          },
        ],
      },
    }),
    ApiResponse({
      status: 403,
      description: 'El usuario no tiene permisos para ver incidencias',
    }),
  );

export const FindOneIncidenciaDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Obtener incidencia por ID',
      description: 'Obtiene los detalles de una incidencia de la empresa actual.',
    }),
    ApiParam({
      name: 'id',
      description: 'UUID de la incidencia',
      example: '0a996172-9b0f-45f6-879f-51e9f08de111',
    }),
    ApiResponse({
      status: 200,
      description: 'Incidencia encontrada',
      schema: {
        example: {
          id: '0a996172-9b0f-45f6-879f-51e9f08de111',
          name: 'Fuga en piso 3',
          description: 'Se detectó fuga en el baño principal',
          tipo: 'por_dano',
          status: 'PENDING',
          createdAt: '2025-11-18T09:21:15.988Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Incidencia no encontrada',
    }),
    ApiResponse({
      status: 403,
      description: 'El usuario no tiene permisos para ver incidencias',
    }),
  );

export const UpdateIncidenciaDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Actualizar incidencia',
      description:
        'Actualiza los campos permitidos de una incidencia de la empresa actual.',
    }),
    ApiParam({
      name: 'id',
      description: 'UUID de la incidencia',
      example: '0a996172-9b0f-45f6-879f-51e9f08de111',
    }),
    ApiBody({ type: UpdateIncidenciaDto }),
    ApiResponse({
      status: 200,
      description: 'Incidencia actualizada',
    }),
    ApiResponse({
      status: 404,
      description: 'Incidencia no encontrada',
    }),
    ApiResponse({
      status: 403,
      description: 'El usuario no tiene permisos para editar incidencias',
    }),
  );

export const DeleteIncidenciaDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Eliminar incidencia',
      description:
        'Realiza un soft-delete de una incidencia perteneciente a la empresa del usuario.',
    }),
    ApiParam({
      name: 'id',
      description: 'UUID de la incidencia',
      example: '0a996172-9b0f-45f6-879f-51e9f08de111',
    }),
    ApiResponse({
      status: 200,
      description: 'Incidencia eliminada',
      schema: { example: { message: 'Incidencia eliminada correctamente' } },
    }),
    ApiResponse({
      status: 404,
      description: 'Incidencia no encontrada',
    }),
    ApiResponse({
      status: 403,
      description: 'El usuario no tiene permisos para eliminar incidencias',
    }),
  );
