import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // Extract refresh token from cookie or header (for server-to-server calls)
    const token: string | undefined =
      req.cookies?.['refresh_token'] || req.headers?.['x-refresh-token'];

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

    // Stolen token detection: if token was already revoked, revoke ALL user tokens
    if (record.revokedAt) {
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
    };

    return true;
  }
}
