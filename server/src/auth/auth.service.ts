import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private static readonly RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        userType: 'general_user',
      },
    });

    return {
      ...this.generateToken(user.id, user.email),
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      ...this.generateToken(user.id, user.email),
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    };
  }

  async oauthLogin(email: string, provider?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Fix userType if still general_user from before the linkAccount event
    if (provider && user.userType === 'general_user') {
      const providerMap: Record<string, string> = {
        google: 'google_user',
        github: 'github_user',
        facebook: 'facebook_user',
      };
      const userType = providerMap[provider];
      if (userType) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { userType: userType as any },
        });
      }
    }

    return {
      ...this.generateToken(user.id, user.email),
      id: user.id,
      email: user.email,
      name: user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
    };
  }

  async refresh(userId: string, email: string) {
    return this.generateToken(userId, email);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || user.userType !== 'general_user') {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    // Delete any existing tokens for this email
    await this.prisma.passwordResetToken.deleteMany({ where: { email } });

    // Generate a secure random token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + AuthService.RESET_TOKEN_EXPIRY_MS,
    );

    await this.prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    const clientUrl = this.configService.get<string>('CLIENT_URL');
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    await this.mailService.sendPasswordResetEmail(email, resetUrl);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { email: resetToken.email },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  private generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
