import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SharesService } from './shares.service';
import { BulkAddSharesDto } from './dto/bulk-add-shares.dto';
import { UpdateSharePermissionDto } from './dto/update-share-permission.dto';

@Controller('shares')
@UseGuards(AuthGuard('jwt'))
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post()
  addShares(
    @Req() req: { user: { id: string } },
    @Body() dto: BulkAddSharesDto,
  ) {
    return this.sharesService.addShares(req.user.id, dto);
  }

  @Get('note/:noteId')
  getSharesForNote(
    @Req() req: { user: { id: string } },
    @Param('noteId') noteId: string,
  ) {
    return this.sharesService.getSharesForNote(noteId, req.user.id);
  }

  @Patch(':shareId')
  updatePermission(
    @Req() req: { user: { id: string } },
    @Param('shareId') shareId: string,
    @Body() dto: UpdateSharePermissionDto,
  ) {
    return this.sharesService.updatePermission(shareId, req.user.id, dto);
  }

  @Delete(':shareId')
  removeShare(
    @Req() req: { user: { id: string } },
    @Param('shareId') shareId: string,
  ) {
    return this.sharesService.removeShare(shareId, req.user.id);
  }

  @Delete('invite/:inviteId')
  removeInvite(
    @Req() req: { user: { id: string } },
    @Param('inviteId') inviteId: string,
  ) {
    return this.sharesService.removeInvite(inviteId, req.user.id);
  }
}
