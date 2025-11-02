import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class CustomBadRequestFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    if (status === HttpStatus.BAD_REQUEST) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        message: 'Credenciales invalidas',
        error: 'Bad Request',
      });
    } else {
      response.status(status).json(exception.getResponse());
    }
  }
}
