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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search users by email or name' })
  @ApiQuery({ name: 'email', description: 'Search query (email or name)', required: true })
  @ApiResponse({ status: 200, description: 'List of matching users' })
  searchByEmail(
    @Query('email') email: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.usersService.searchByEmail(email, req.user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getProfile(@Request() req: { user: { id: string } }) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Passwords do not match or OAuth user' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  changePassword(
    @Request() req: { user: { id: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  @Post('me/photo-upload-url')
  @ApiOperation({ summary: 'Create a signed URL for avatar upload' })
  @ApiResponse({ status: 201, description: 'Signed upload URL created' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
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
  @ApiOperation({ summary: 'Update user avatar photo' })
  @ApiResponse({ status: 200, description: 'Photo updated' })
  updatePhoto(
    @Request() req: { user: { id: string } },
    @Body() dto: { photoUrl: string },
  ) {
    return this.usersService.updatePhoto(req.user.id, dto.photoUrl);
  }

  @Delete('me/photo')
  @ApiOperation({ summary: 'Remove user avatar photo' })
  @ApiResponse({ status: 200, description: 'Photo removed' })
  removePhoto(@Request() req: { user: { id: string } }) {
    return this.usersService.removePhoto(req.user.id);
  }
}
