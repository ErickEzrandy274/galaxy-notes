import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  searchByEmail(
    @Query('email') email: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.usersService.searchByEmail(email, req.user.id);
  }

  @Get('me')
  getProfile(@Request() req: { user: { id: string } }) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/password')
  changePassword(
    @Request() req: { user: { id: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  @Post('me/photo-upload-url')
  createPhotoUploadUrl(
    @Request() req: { user: { id: string } },
    @Body() dto: { fileName: string; mimeType: string; fileSize: number },
  ) {
    return this.usersService.createPhotoUploadUrl(
      req.user.id,
      dto.fileName,
      dto.mimeType,
      dto.fileSize,
    );
  }

  @Patch('me/photo')
  updatePhoto(
    @Request() req: { user: { id: string } },
    @Body() dto: { photoUrl: string },
  ) {
    return this.usersService.updatePhoto(req.user.id, dto.photoUrl);
  }

  @Delete('me/photo')
  removePhoto(@Request() req: { user: { id: string } }) {
    return this.usersService.removePhoto(req.user.id);
  }
}
