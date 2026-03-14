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
import { GetVersionsDto } from './dto/get-versions.dto';
import { GetTrashedNotesDto } from './dto/get-trashed-notes.dto';

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
    @Query('permission') permission?: string,
    @Query('ownerSearch') ownerSearch?: string,
  ) {
    return this.notesService.findAll(req.user.id, +page, +limit, {
      status,
      search,
      tags: tags ? tags.split(',') : undefined,
      permission,
      ownerSearch,
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

  @Get('trash')
  findTrashed(
    @Request() req: { user: { id: string } },
    @Query() query: GetTrashedNotesDto,
  ) {
    return this.notesService.findTrashed(req.user.id, query.page, query.limit, {
      search: query.search,
      tags: query.tags ? query.tags.split(',') : undefined,
    });
  }

  @Delete('trash')
  emptyTrash(@Request() req: { user: { id: string } }) {
    return this.notesService.emptyTrash(req.user.id);
  }

  @Get('trash/:id')
  findTrashedById(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.findTrashedById(id, req.user.id);
  }

  @Delete('trash/:id')
  permanentDelete(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.permanentDelete(id, req.user.id);
  }

  @Get(':id/versions')
  getVersionHistory(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Query() query: GetVersionsDto,
  ) {
    return this.notesService.getVersionHistory(
      id,
      req.user.id,
      query.cursor,
      query.limit,
    );
  }

  @Get(':id/versions/:versionId')
  getVersionById(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.getVersionById(id, versionId, req.user.id);
  }

  @Post(':id/versions/:versionId/restore')
  restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.restoreVersion(id, versionId, req.user.id);
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.notesService.findById(id, req.user.id);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateNoteDto) {
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
  restore(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.notesService.restore(id, req.user.id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.notesService.archive(id, req.user.id);
  }

  @Post(':id/unarchive')
  unarchive(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.unarchive(id, req.user.id);
  }
}
