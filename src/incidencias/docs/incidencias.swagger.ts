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
          imageGroupId: '0a996172-9b0f-45f6-879f-51e9f08de111',
          images: [
            {
              id: 'b3fb3b7a-a0b2-4ff8-920d-2e5d0c07bbf7',
              incidenciaId: '0a996172-9b0f-45f6-879f-51e9f08de111',
              url: 'http://localhost:9000/oceanix-tickets/incidencias/<tenant>/<incidencia>/1337-foto.png',
              mimeType: 'image/png',
              originalName: 'foto.png',
            },
          ],
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

export const CreateIncidenciaClientDoc = () =>
  applyDecorators(
    ApiCookieAuth('authToken'),
    ApiConsumes('multipart/form-data'),
    ApiOperation({
      summary: 'Crear incidencia como cliente',
      description:
        'Permite a los clientes crear una nueva incidencia reportando problemas con productos o servicios. ' +
        'La incidencia será asignada automáticamente a un empleado disponible. ' +
        'Acepta hasta 5 imágenes adjuntas para documentar el problema.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 3,
            example: 'Laptop Dell no enciende',
            description: 'Título breve de la incidencia',
          },
          description: {
            type: 'string',
            example: 'La laptop Dell Inspiron 15 asignada a mi escritorio no enciende. La luz de carga parpadea pero la pantalla permanece negra.',
            description: 'Descripción detallada del problema',
          },
          ProducReferenceId: {
            type: 'string',
            example: 'LAPTOP-DELL-2024-001',
            description: 'Código de referencia del producto o activo afectado',
          },
          tipo: {
            type: 'string',
            enum: Object.values(TipoIncidencia),
            example: TipoIncidencia.POR_FALLA_TECNICA,
            description: 'Tipo de incidencia según la naturaleza del problema',
          },
          images: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Imágenes que evidencian el problema (máximo 5)',
          },
        },
        required: ['name', 'description', 'tipo', 'ProducReferenceId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Incidencia creada exitosamente',
      schema: {
        example: {
          id: '6cbf0b20-2ed2-4649-9aa0-95fd2eb2ede3',
          name: 'Laptop Dell no enciende',
          description: 'La laptop Dell Inspiron 15 asignada a mi escritorio no enciende. La luz de carga parpadea pero la pantalla permanece negra.',
          tipo: 'POR_FALLA_TECNICA',
          status: 'PENDING',
          ProducReferenceId: 'LAPTOP-DELL-2024-001',
          enterpriseId: 'ca62eba3-086e-4bad-9e42-4d8cfa83a6be',
          createdByUserId: '6cbf0b20-2ed2-4649-9aa0-95fd2eb2ede3',
          assignedEmployeeId: 'ad8985f6-66b4-457e-82a0-72068d23ce1c',
          createdAt: '2025-11-22T14:27:29.000Z',
          updatedAt: '2025-11-22T14:27:29.000Z',
          imageGroupId: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
          images: [
            {
              id: 'b3fb3b7a-a0b2-4ff8-920d-2e5d0c07bbf7',
              incidenciaId: '6cbf0b20-2ed2-4649-9aa0-95fd2eb2ede3',
              url: 'http://localhost:9000/oceanix-uploads/incidencias/techcorp/laptop-error.jpg',
              mimeType: 'image/jpeg',
              originalName: 'laptop-error.jpg',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Datos inválidos o más de 5 imágenes adjuntas',
      schema: {
        example: {
          statusCode: 400,
          message: ['name must be longer than or equal to 3 characters'],
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autenticado - Token de autenticación inválido o ausente',
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado - Solo usuarios tipo CLIENT pueden crear incidencias por este endpoint',
    }),
    ApiResponse({
      status: 429,
      description: 'Demasiadas peticiones - Máximo 5 incidencias por minuto',
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
          imageGroupId: '0a996172-9b0f-45f6-879f-51e9f08de111',
          images: [
            {
              id: 'b3fb3b7a-a0b2-4ff8-920d-2e5d0c07bbf7',
              incidenciaId: '0a996172-9b0f-45f6-879f-51e9f08de111',
              url: 'http://localhost:9000/oceanix-tickets/...',
              mimeType: 'image/png',
              originalName: 'foto1.png',
            },
          ],
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
      description: `Actualiza ÚNICAMENTE los campos permitidos de una incidencia.

      **Campos Editables:**
      - **status**: Cambiar el estado de la incidencia (PENDING, IN_PROGRESS, RESOLVED, CANCELLED)
      - **assignedEmployeeId**: Reasignar la incidencia a otro empleado

      **Restricciones:**
      - NO se puede editar: name, description, tipo, ProducReferenceId (información original de la incidencia)
      - Solo se puede editar incidencias de la empresa del usuario autenticado
      - Todos los campos son opcionales en la actualización`,
    }),
    ApiParam({
      name: 'id',
      description: 'UUID de la incidencia',
      example: '0a996172-9b0f-45f6-879f-51e9f08de111',
    }),
    ApiBody({
      type: UpdateIncidenciaDto,
      examples: {
        updateStatus: {
          summary: 'Cambiar estado',
          description: 'Actualizar solo el estado de la incidencia',
          value: {
            status: 'IN_PROGRESS',
          },
        },
        reassignEmployee: {
          summary: 'Reasignar empleado',
          description: 'Cambiar el empleado asignado a la incidencia',
          value: {
            assignedEmployeeId: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
        updateBoth: {
          summary: 'Actualizar estado y empleado',
          description: 'Cambiar ambos campos simultáneamente',
          value: {
            status: 'RESOLVED',
            assignedEmployeeId: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Incidencia actualizada exitosamente',
      schema: {
        example: {
          id: '0a996172-9b0f-45f6-879f-51e9f08de111',
          name: 'Fuga en piso 3',
          description: 'Se detectó fuga en el baño principal',
          tipo: 'por_dano',
          status: 'IN_PROGRESS',
          assignedEmployeeId: '550e8400-e29b-41d4-a716-446655440000',
          ProducReferenceId: 'INC-123456789',
          createdAt: '2025-11-18T09:21:15.988Z',
          updatedAt: '2025-11-22T14:30:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validación fallida - valores inválidos para status o assignedEmployeeId',
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

export const GetIncidenciaImagesDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Listar imágenes de una incidencia',
      description:
        'Devuelve los metadatos de todas las imágenes asociadas a la incidencia. Solo necesitas el ID de la incidencia para obtenerlas.',
    }),
    ApiParam({
      name: 'incidenciaId',
      description: 'UUID de la incidencia',
      example: '0a996172-9b0f-45f6-879f-51e9f08de111',
    }),
    ApiResponse({
      status: 200,
      description: 'Listado de imágenes',
      schema: {
        example: {
          imageGroupId: '0a996172-9b0f-45f6-879f-51e9f08de111',
          images: [
            {
              id: 'b3fb3b7a-a0b2-4ff8-920d-2e5d0c07bbf7',
              incidenciaId: '0a996172-9b0f-45f6-879f-51e9f08de111',
              url: 'http://localhost:9000/oceanix-tickets/incidencias/<tenant>/<incidencia>/<archivo>.png',
              mimeType: 'image/png',
              originalName: 'foto1.png',
            },
          ],
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

export const GetIncidenciaImageDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Descargar imagen de incidencia',
      description:
        'Devuelve el archivo binario de una imagen asociada a la incidencia especificada.',
    }),
    ApiParam({
      name: 'incidenciaId',
      description: 'UUID de la incidencia',
      example: '0a996172-9b0f-45f6-879f-51e9f08de111',
    }),
    ApiParam({
      name: 'imageId',
      description: 'UUID de la imagen',
      example: '9a776172-9b0f-45f6-879f-51e9f08de999',
    }),
    ApiResponse({
      status: 200,
      description: 'Imagen devuelta exitosamente (contenido binario)',
    }),
    ApiResponse({
      status: 404,
      description: 'Imagen no encontrada para la incidencia dada',
    }),
    ApiResponse({
      status: 403,
      description: 'El usuario no tiene permisos para ver incidencias',
    }),
  );

export const GetImageByIdDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth('authToken'),
    ApiOperation({
      summary: 'Descargar imagen por ID',
      description: 'Devuelve una imagen directamente usando su ID único.',
    }),
    ApiParam({
      name: 'imageId',
      description: 'UUID de la imagen',
      example: '9a776172-9b0f-45f6-879f-51e9f08de999',
    }),
    ApiResponse({
      status: 200,
      description: 'Imagen devuelta exitosamente (contenido binario)',
    }),
    ApiResponse({
      status: 404,
      description: 'Imagen no encontrada para este tenant',
    }),
    ApiResponse({
      status: 403,
      description: 'El usuario no tiene permisos para ver incidencias',
    }),
  );
