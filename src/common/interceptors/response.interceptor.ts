import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseFactory, SuccessResponse } from '../dto/response.dto';

/**
 * Interceptor global que envuelve todas las respuestas exitosas
 * en un formato estandarizado { success: true, data, statusCode }
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((data) => {
        // Si ya es una respuesta formateada, devolverla tal cual
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Envolver respuesta en formato estándar
        return ResponseFactory.success(data, statusCode);
      })
    );
  }
}
