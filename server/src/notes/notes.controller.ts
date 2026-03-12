import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotesService } from './notes.service';
import { CreateSignedUploadUrlDto } from './dto/create-signed-upload-url.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
@UseGuards(AuthGuard('jwt'))
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string,
  ) {
    return this.notesService.findAll(req.user.id, +page, +limit, {
      status,
      search,
      tags: tags ? tags.split(',') : undefined,
    });
  }

  @Get('stats')
  getStats(@Request() req: { user: { id: string } }) {
    return this.notesService.getStats(req.user.id);
  }

  @Get('tags')
  getUserTags(@Request() req: { user: { id: string } }) {
    return this.notesService.getUserTags(req.user.id);
  }

  @Post('upload-url')
  createSignedUploadUrl(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateSignedUploadUrlDto,
  ) {
    return this.notesService.createSignedUploadUrl(
      req.user.id,
      dto.noteId,
      dto.fileName,
      dto.mimeType,
      dto.fileSize,
      dto.source,
    );
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.findById(id, req.user.id);
  }

  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateNoteDto,
  ) {
    return this.notesService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  softDelete(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.softDelete(id, req.user.id);
  }

  @Post(':id/restore')
  restore(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.restore(id, req.user.id);
  }
}
