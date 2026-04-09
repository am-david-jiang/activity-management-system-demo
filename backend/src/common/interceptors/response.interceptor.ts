import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from '../interfaces/response.interface';

interface ResponseWithStatus {
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // Handle 204 No Content or void returns
        if (statusCode === 204 || data === undefined || data === null) {
          return {
            code: 0,
            success: true,
            data: null,
            message: statusCode === 204 ? 'No Content' : 'OK',
          };
        }

        // Success response (2xx)
        const isSuccess = statusCode >= 200 && statusCode < 300;
        return {
          code: isSuccess ? 0 : statusCode,
          success: isSuccess,
          data,
          message: this.getMessage(statusCode),
        };
      }),
    );
  }

  private getMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      500: 'Internal Server Error',
    };
    return messages[statusCode] || 'Unknown';
  }
}
