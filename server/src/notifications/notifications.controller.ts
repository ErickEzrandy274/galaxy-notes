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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AppLogger } from '../common/logger/app.logger';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { MuteUserDto } from './dto/mute-user.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new AppLogger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── SSE Stream ────────────────────────────────────────────
  // EventSource doesn't support custom headers, so JWT is passed via query param.

  @Sse('stream')
  @ApiOperation({ summary: 'Subscribe to real-time notifications via SSE' })
  @ApiQuery({
    name: 'token',
    description: 'JWT access token (EventSource cannot use headers)',
  })
  @ApiResponse({ status: 200, description: 'SSE stream opened' })
  @ApiResponse({ status: 401, description: 'Invalid or missing token' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List notifications with pagination and filter' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter (unread, shared)',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of notifications' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  unreadCount(@Req() req: { user: { id: string } }) {
    return this.notificationsService.countUnread(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('muted-users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of muted users' })
  @ApiResponse({ status: 200, description: 'List of muted users' })
  getMutedUsers(@Req() req: { user: { id: string } }) {
    return this.notificationsService.getMutedUsers(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('read-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@Req() req: { user: { id: string } }) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  remove(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.notificationsService.remove(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('mute/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mute notifications from a user' })
  @ApiParam({ name: 'userId', description: 'User ID to mute' })
  @ApiResponse({ status: 201, description: 'User muted' })
  @ApiResponse({ status: 400, description: 'Cannot mute yourself' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unmute notifications from a user' })
  @ApiParam({ name: 'userId', description: 'User ID to unmute' })
  @ApiResponse({ status: 200, description: 'User unmuted' })
  @ApiResponse({ status: 404, description: 'Mute not found' })
  unmuteUser(
    @Req() req: { user: { id: string } },
    @Param('userId') mutedUserId: string,
  ) {
    return this.notificationsService.unmuteUser(req.user.id, mutedUserId);
  }
}
