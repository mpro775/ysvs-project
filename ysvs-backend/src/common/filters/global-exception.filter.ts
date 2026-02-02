import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../interfaces/response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'حدث خطأ داخلي في الخادم';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = this.extractMessage(responseObj);
        error = (responseObj.error as string) || exception.name;
      }
    } else if (exception instanceof Error) {
      // Handle MongoDB duplicate key error
      if ((exception as any).code === 11000) {
        status = HttpStatus.CONFLICT;
        message = this.extractDuplicateKeyMessage(exception);
        error = 'Conflict';
      } else {
        message = exception.message;
        error = exception.name;
      }
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse: ErrorResponse = {
      statusCode: status,
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private extractMessage(responseObj: Record<string, unknown>): string {
    if (Array.isArray(responseObj.message)) {
      return responseObj.message[0] as string;
    }
    return (responseObj.message as string) || 'حدث خطأ غير متوقع';
  }

  private extractDuplicateKeyMessage(exception: Error): string {
    const message = exception.message;
    
    if (message.includes('email')) {
      return 'هذا البريد الإلكتروني مسجل مسبقاً';
    }
    if (message.includes('slug')) {
      return 'هذا الرابط المختصر مستخدم مسبقاً';
    }
    if (message.includes('serialNumber')) {
      return 'هذا الرقم التسلسلي مستخدم مسبقاً';
    }
    if (message.includes('registrationNumber')) {
      return 'رقم التسجيل مستخدم مسبقاً';
    }
    
    return 'هذه البيانات موجودة مسبقاً';
  }
}
