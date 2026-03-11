import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  register(
    @Body()
    dto: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('oauth-login')
  oauthLogin(
    @Body() dto: { email: string; provider?: string },
    @Headers('x-internal-secret') secret: string,
  ) {
    const expected = this.configService.get<string>('INTERNAL_API_SECRET');
    if (!expected || secret !== expected) {
      throw new ForbiddenException('Unauthorized');
    }
    return this.authService.oauthLogin(dto.email, dto.provider);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  refresh(@Req() req: { user: { id: string; email: string } }) {
    return this.authService.refresh(req.user.id, req.user.email);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
