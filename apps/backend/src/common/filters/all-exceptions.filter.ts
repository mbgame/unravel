import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiError } from '@unravel/shared-types';

/**
 * Global exception filter.
 * Converts all thrown exceptions into the standard ApiError response shape.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const exRes = exceptionResponse as Record<string, unknown>;
        message = typeof exRes['message'] === 'string' ? exRes['message'] : message;
        if (Array.isArray(exRes['message'])) {
          errors = exRes['message'] as string[];
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} — ${statusCode}: ${message}`,
    );

    const errorResponse: ApiError = {
      success: false,
      statusCode,
      message,
      ...(errors !== undefined && { errors }),
    };

    response.status(statusCode).json(errorResponse);
  }
}
