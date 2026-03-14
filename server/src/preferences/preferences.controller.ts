import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PreferencesService } from './preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('preferences')
@UseGuards(AuthGuard('jwt'))
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  getPreferences(@Request() req: { user: { id: string } }) {
    return this.preferencesService.getPreferences(req.user.id);
  }

  @Patch()
  updatePreferences(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.preferencesService.updatePreferences(req.user.id, dto);
  }
}
