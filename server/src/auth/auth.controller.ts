import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Headers,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { LoginThrottleGuard } from './guards/login-throttle.guard';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly loginThrottle: LoginThrottleGuard,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);
    const { refreshToken, ...body } = result;
    return body;
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 201, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @UseGuards(LoginThrottleGuard)
  async login(
    @Body() dto: { email: string; password: string },
    @Res({ passthrough: true }) res: express.Response,
  ) {
    try {
      const result = await this.authService.login(dto.email, dto.password);
      this.loginThrottle.clearAttempts(dto.email);
      this.setRefreshTokenCookie(res, result.refreshToken);
      const { refreshToken, ...body } = result;
      return body;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.loginThrottle.recordFailure(dto.email);
      }
      throw error;
    }
  }

  @Post('oauth-login')
  @ApiOperation({ summary: 'OAuth login (server-to-server from NextAuth)' })
  @ApiResponse({ status: 201, description: 'OAuth login successful' })
  @ApiResponse({ status: 403, description: 'Invalid internal secret' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async oauthLogin(
    @Body() dto: { email: string; provider?: string },
    @Headers('x-internal-secret') secret: string,
  ) {
    const expected = this.configService.get<string>('INTERNAL_API_SECRET');
    if (!expected || secret !== expected) {
      throw new ForbiddenException('Unauthorized');
    }
    // OAuth login is called server-to-server from NextAuth,
    // so return refreshToken in body (can't set browser cookie directly)
    return this.authService.oauthLogin(dto.email, dto.provider);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 201, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { token, userId, email } = req.refreshTokenData;
    const result = await this.authService.refreshWithToken(
      token,
      userId,
      email,
    );
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out and revoke all refresh tokens' })
  @ApiResponse({ status: 201, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @Req() req: { user: { id: string } },
    @Res({ passthrough: true }) res: express.Response,
  ) {
    await this.authService.revokeAllRefreshTokens(req.user.id);
    this.clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 201, description: 'Reset email sent (if account exists)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with a valid token' })
  @ApiResponse({ status: 201, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  private setRefreshTokenCookie(res: express.Response, token: string) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/auth',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  private clearRefreshTokenCookie(res: express.Response) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/auth',
    });
  }
}
