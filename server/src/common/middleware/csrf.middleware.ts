import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly allowedOrigins: Set<string>;

  constructor() {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    this.allowedOrigins = new Set(
      clientUrl.split(',').map((o) => o.trim()),
    );
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (SAFE_METHODS.has(req.method)) {
      return next();
    }

    const origin = req.headers['origin'] as string | undefined;
    const referer = req.headers['referer'] as string | undefined;

    // Extract origin from Referer as fallback (some browsers omit Origin on same-origin POST)
    const effectiveOrigin = origin || this.extractOrigin(referer);

    // No Origin or Referer = server-to-server call (not a browser request).
    // CSRF is a browser-only attack, so these are safe to allow.
    if (!effectiveOrigin) {
      return next();
    }

    if (!this.allowedOrigins.has(effectiveOrigin)) {
      const requestId = req.requestId || 'unknown';
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Request blocked: invalid origin',
        requestId,
      });
    }

    next();
  }

  private extractOrigin(referer: string | undefined): string | undefined {
    if (!referer) return undefined;
    try {
      const url = new URL(referer);
      return url.origin;
    } catch {
      return undefined;
    }
  }
}
