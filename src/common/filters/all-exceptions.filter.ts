import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtre d'exceptions global.
 *
 * Format de réponse attendu par l'ErrorInterceptor du frontend :
 *   error.error.message  → string ou string[]
 *   error.error.statusCode → number
 *
 * Exemples de lecture dans error.interceptor.ts :
 *   if (error.error?.message) {
 *     return Array.isArray(error.error.message)
 *       ? error.error.message[0]
 *       : error.error.message;
 *   }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erreur interne du serveur';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string | string[]) ?? message;
        error = (resp.error as string) ?? error;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Exception non gérée: ${exception.message}`, exception.stack);
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    this.logger.warn(`${request.method} ${request.url} → ${status}`);

    // Format compatible avec l'ErrorInterceptor Angular du frontend
    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
