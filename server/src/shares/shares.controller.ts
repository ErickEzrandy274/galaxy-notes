import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SharesService } from './shares.service';
import { BulkAddSharesDto } from './dto/bulk-add-shares.dto';
import { UpdateSharePermissionDto } from './dto/update-share-permission.dto';

@ApiTags('Shares')
@ApiBearerAuth()
@Controller('shares')
@UseGuards(AuthGuard('jwt'))
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post()
  @ApiOperation({ summary: 'Share a note with one or more recipients' })
  @ApiResponse({ status: 201, description: 'Shares created and/or invites sent' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 403, description: 'Only the note owner can share' })
  @ApiResponse({ status: 400, description: 'Note is draft or archived' })
  addShares(
    @Req() req: { user: { id: string } },
    @Body() dto: BulkAddSharesDto,
  ) {
    return this.sharesService.addShares(req.user.id, dto);
  }

  @Get('note/:noteId')
  @ApiOperation({ summary: 'Get all shares and pending invites for a note' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Shares and pending invites' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  getSharesForNote(
    @Req() req: { user: { id: string } },
    @Param('noteId') noteId: string,
  ) {
    return this.sharesService.getSharesForNote(noteId, req.user.id);
  }

  @Patch(':shareId')
  @ApiOperation({ summary: 'Update a share permission' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiResponse({ status: 200, description: 'Permission updated' })
  @ApiResponse({ status: 404, description: 'Share not found' })
  @ApiResponse({ status: 403, description: 'Only the note owner can update permissions' })
  updatePermission(
    @Req() req: { user: { id: string } },
    @Param('shareId') shareId: string,
    @Body() dto: UpdateSharePermissionDto,
  ) {
    return this.sharesService.updatePermission(shareId, req.user.id, dto);
  }

  @Delete(':shareId')
  @ApiOperation({ summary: 'Remove a share (owner revoke or recipient leave)' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiResponse({ status: 200, description: 'Share removed' })
  @ApiResponse({ status: 404, description: 'Share not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  removeShare(
    @Req() req: { user: { id: string } },
    @Param('shareId') shareId: string,
  ) {
    return this.sharesService.removeShare(shareId, req.user.id);
  }

  @Post('request-access/:noteId')
  @ApiOperation({ summary: 'Request access to a shared note' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiResponse({ status: 201, description: 'Access request sent' })
  @ApiResponse({ status: 400, description: 'Already has access or request already sent' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  requestAccess(
    @Req() req: { user: { id: string } },
    @Param('noteId') noteId: string,
  ) {
    return this.sharesService.requestAccess(noteId, req.user.id);
  }

  @Post('grant-access/:noteId/:userId')
  @ApiOperation({ summary: 'Grant access to a requesting user' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiParam({ name: 'userId', description: 'Requesting user ID' })
  @ApiQuery({ name: 'permission', required: false, enum: ['READ', 'WRITE'], description: 'Permission to grant' })
  @ApiResponse({ status: 201, description: 'Access granted' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 400, description: 'User already has access or note is archived' })
  grantAccess(
    @Req() req: { user: { id: string } },
    @Param('noteId') noteId: string,
    @Param('userId') userId: string,
    @Query('permission') permission?: 'READ' | 'WRITE',
  ) {
    return this.sharesService.grantAccess(
      noteId,
      userId,
      req.user.id,
      permission,
    );
  }

  @Post('decline-access/:noteId/:userId')
  @ApiOperation({ summary: 'Decline an access request' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiParam({ name: 'userId', description: 'Requesting user ID' })
  @ApiResponse({ status: 201, description: 'Access request declined' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  declineAccess(
    @Req() req: { user: { id: string } },
    @Param('noteId') noteId: string,
    @Param('userId') userId: string,
  ) {
    return this.sharesService.declineAccess(noteId, userId, req.user.id);
  }

  @Delete('invite/:inviteId')
  @ApiOperation({ summary: 'Remove a pending invite' })
  @ApiParam({ name: 'inviteId', description: 'Invite ID' })
  @ApiResponse({ status: 200, description: 'Invite removed' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 403, description: 'Only the note owner can remove invites' })
  removeInvite(
    @Req() req: { user: { id: string } },
    @Param('inviteId') inviteId: string,
  ) {
    return this.sharesService.removeInvite(inviteId, req.user.id);
  }
}
