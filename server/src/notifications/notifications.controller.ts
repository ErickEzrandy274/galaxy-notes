import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Sse,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { MuteUserDto } from './dto/mute-user.dto';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── SSE Stream ────────────────────────────────────────────
  // EventSource doesn't support custom headers, so JWT is passed via query param.

  @Sse('stream')
  stream(
    @Req() req: Request,
    @Query('token') token: string,
  ): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = payload.sub;
    this.logger.log(`SSE stream opened for user ${userId}`);

    const stream$ = this.notificationsService.getStream(userId);

    // Clean up on client disconnect
    req.on('close', () => {
      this.logger.log(`SSE stream closed for user ${userId}`);
      this.notificationsService.removeStream(userId);
    });

    return stream$;
  }

  // ── CRUD Endpoints (JWT-guarded) ──────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(
    @Req() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('filter') filter?: string,
  ) {
    return this.notificationsService.findAllByUser(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      filter,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('unread-count')
  unreadCount(@Req() req: { user: { id: string } }) {
    return this.notificationsService.countUnread(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('muted-users')
  getMutedUsers(@Req() req: { user: { id: string } }) {
    return this.notificationsService.getMutedUsers(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/read')
  markAsRead(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('read-all')
  markAllAsRead(@Req() req: { user: { id: string } }) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.notificationsService.remove(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('mute/:userId')
  muteUser(
    @Req() req: { user: { id: string } },
    @Param('userId') mutedUserId: string,
    @Body() dto: MuteUserDto,
  ) {
    return this.notificationsService.muteUser(
      req.user.id,
      mutedUserId,
      dto.duration,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('mute/:userId')
  unmuteUser(
    @Req() req: { user: { id: string } },
    @Param('userId') mutedUserId: string,
  ) {
    return this.notificationsService.unmuteUser(req.user.id, mutedUserId);
  }
}
