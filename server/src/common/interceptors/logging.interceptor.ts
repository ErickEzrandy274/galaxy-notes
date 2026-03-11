import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const requestId = req.requestId || '-';
    const method = req.method;
    const url = req.originalUrl;
    const userId = (req as any).user?.id || 'anonymous';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.log(
            `[${requestId}] ${method} ${url} userId=${userId} → ${res.statusCode} (${duration}ms)`,
          );
        },
        error: (error) => {
          const duration = Date.now() - start;
          const status = error?.status || 500;
          this.logger.warn(
            `[${requestId}] ${method} ${url} userId=${userId} → ${status} (${duration}ms)`,
          );
        },
      }),
    );
  }
}
