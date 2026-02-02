import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse } from '../interfaces/response.interface';

export interface ResponseData<T> {
  data?: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((responseData: ResponseData<T> | T) => {
        // Check if response is already formatted with data property
        if (
          responseData &&
          typeof responseData === 'object' &&
          'data' in responseData
        ) {
          const typedResponse = responseData as ResponseData<T>;
          return {
            statusCode,
            success: true,
            message: typedResponse.message || 'تمت العملية بنجاح',
            data: typedResponse.data,
            meta: typedResponse.meta,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        // Raw data response
        return {
          statusCode,
          success: true,
          message: 'تمت العملية بنجاح',
          data: responseData as T,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
