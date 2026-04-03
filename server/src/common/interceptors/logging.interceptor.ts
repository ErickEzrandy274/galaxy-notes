import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app.logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new AppLogger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const method = req.method;
    const url = req.originalUrl;
    const userId =
      (req as Request & { user?: { id: string } }).user?.id || 'anonymous';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.log(
            `${method} ${url} userId=${userId} → ${res.statusCode} (${duration}ms)`,
          );
        },
        error: (error: unknown) => {
          const duration = Date.now() - start;
          const status = (error as { status?: number })?.status || 500;
          this.logger.warn(
            `${method} ${url} userId=${userId} → ${status} (${duration}ms)`,
          );
        },
      }),
    );
  }
}
