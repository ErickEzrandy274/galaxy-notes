import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

interface RefreshTokenData {
  token: string;
  userId: string;
  email: string;
  isGracePeriodReuse: boolean;
}

type RequestWithRefreshToken = Request & {
  refreshTokenData?: RefreshTokenData;
};

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  // Grace period: allow a revoked token to be reused within this window.
  // This prevents multi-tab race conditions where two tabs try to refresh
  // the same token simultaneously — the first succeeds and revokes it,
  // the second should still be allowed through within the grace period.
  private static readonly ROTATION_GRACE_MS = 30_000; // 30 seconds

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithRefreshToken>();

    // Extract refresh token from cookie or header (for server-to-server calls)
    const token: string | undefined =
      (req.cookies as Record<string, string> | undefined)?.['refresh_token'] ||
      (req.headers['x-refresh-token'] as string | undefined);

    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const record = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Stolen token detection with grace period for multi-tab scenarios
    if (record.revokedAt) {
      const msSinceRevoked = Date.now() - new Date(record.revokedAt).getTime();

      if (msSinceRevoked <= RefreshTokenGuard.ROTATION_GRACE_MS) {
        // Within grace period — look up the replacement token and use it.
        // Return the replacement token's data so the controller can issue
        // the same new token instead of creating a duplicate rotation.
        if (record.replacedByToken) {
          const replacement = await this.prisma.refreshToken.findUnique({
            where: { token: record.replacedByToken },
            include: { user: true },
          });

          if (replacement && !replacement.revokedAt) {
            req.refreshTokenData = {
              token: replacement.token,
              userId: replacement.userId,
              email: replacement.user.email,
              isGracePeriodReuse: true,
            };
            return true;
          }
        }
      }

      // Outside grace period — genuine stolen token, revoke ALL user tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Refresh token reuse detected — all sessions revoked',
      );
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Attach data for downstream use
    req.refreshTokenData = {
      token: record.token,
      userId: record.userId,
      email: record.user.email,
      isGracePeriodReuse: false,
    };

    return true;
  }
}
