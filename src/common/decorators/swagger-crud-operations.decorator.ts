import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiResponse
} from '@nestjs/swagger';
import {
  SwaggerAuthenticationResponses,
  SwaggerValidationResponses,
  SwaggerResourceNotFoundResponse,
  SwaggerResourceConflictResponse
} from './swagger-common-responses.decorator';

interface SwaggerOperationOptions {
  includeNotFound?: boolean;
  includeValidation?: boolean;
  includeConflict?: boolean;
  customResponses?: Array<{ status: number; description: string }>;
}

export function SwaggerGetByIdOperation(
  summary: string, 
  responseType: Type<any>,
  options: SwaggerOperationOptions = { includeNotFound: true }
) {
  const decorators = [
    ApiOperation({ summary }),
    ApiOkResponse({ 
      type: responseType,
      description: 'Recurso encontrado exitosamente'
    }),
    SwaggerAuthenticationResponses()
  ];

  if (options.includeNotFound) {
    decorators.push(SwaggerResourceNotFoundResponse());
  }

  if (options.customResponses) {
    options.customResponses.forEach(response => {
      decorators.push(ApiResponse({ 
        status: response.status, 
        description: response.description 
      }));
    });
  }

  return applyDecorators(...decorators);
}

export function SwaggerGetAllOperation(
  summary: string, 
  responseType: Type<any>
) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiOkResponse({ 
      type: [responseType],
      description: 'Lista de recursos obtenida exitosamente'
    }),
    SwaggerAuthenticationResponses()
  );
}

export function SwaggerCreateOperation(
  summary: string, 
  responseType: Type<any>,
  options: SwaggerOperationOptions = { includeValidation: true, includeConflict: true }
) {
  const decorators = [
    ApiOperation({ summary }),
    ApiCreatedResponse({ 
      type: responseType,
      description: 'Recurso creado exitosamente'
    }),
    SwaggerAuthenticationResponses()
  ];

  if (options.includeValidation) {
    decorators.push(SwaggerValidationResponses());
  }

  if (options.includeConflict) {
    decorators.push(SwaggerResourceConflictResponse());
  }

  if (options.customResponses) {
    options.customResponses.forEach(response => {
      decorators.push(ApiResponse({ 
        status: response.status, 
        description: response.description 
      }));
    });
  }

  return applyDecorators(...decorators);
}

export function SwaggerUpdateOperation(
  summary: string, 
  responseType: Type<any>,
  options: SwaggerOperationOptions = { includeNotFound: true, includeValidation: true }
) {
  const decorators = [
    ApiOperation({ summary }),
    ApiOkResponse({ 
      type: responseType,
      description: 'Recurso actualizado exitosamente'
    }),
    SwaggerAuthenticationResponses()
  ];

  if (options.includeNotFound) {
    decorators.push(SwaggerResourceNotFoundResponse());
  }

  if (options.includeValidation) {
    decorators.push(SwaggerValidationResponses());
  }

  if (options.customResponses) {
    options.customResponses.forEach(response => {
      decorators.push(ApiResponse({ 
        status: response.status, 
        description: response.description 
      }));
    });
  }

  return applyDecorators(...decorators);
}

export function SwaggerDeleteOperation(
  summary: string,
  options: SwaggerOperationOptions = { includeNotFound: true }
) {
  const decorators = [
    ApiOperation({ summary }),
    ApiOkResponse({ description: 'Recurso eliminado exitosamente' }),
    SwaggerAuthenticationResponses()
  ];

  if (options.includeNotFound) {
    decorators.push(SwaggerResourceNotFoundResponse());
  }

  if (options.customResponses) {
    options.customResponses.forEach(response => {
      decorators.push(ApiResponse({ 
        status: response.status, 
        description: response.description 
      }));
    });
  }

  return applyDecorators(...decorators);
}