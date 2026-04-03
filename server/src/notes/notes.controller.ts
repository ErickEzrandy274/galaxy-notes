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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotesService } from './notes.service';
import { CreateSignedUploadUrlDto } from './dto/create-signed-upload-url.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { GetVersionsDto } from './dto/get-versions.dto';
import { GetTrashedNotesDto } from './dto/get-trashed-notes.dto';

@ApiTags('Notes')
@ApiBearerAuth()
@Controller('notes')
@UseGuards(AuthGuard('jwt'))
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'List notes with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filter by status (draft, published, shared, archived, has_shares)',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by title' })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Comma-separated tag filter',
  })
  @ApiQuery({
    name: 'permission',
    required: false,
    description: 'Filter shared notes by permission (READ, WRITE)',
  })
  @ApiQuery({
    name: 'ownerSearch',
    required: false,
    description: 'Filter shared notes by owner name',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of notes' })
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
  @ApiOperation({ summary: 'Get note statistics for current user' })
  @ApiResponse({ status: 200, description: 'Note count statistics' })
  getStats(@Request() req: { user: { id: string } }) {
    return this.notesService.getStats(req.user.id);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags used by current user with counts' })
  @ApiResponse({ status: 200, description: 'List of tags with usage counts' })
  getUserTags(@Request() req: { user: { id: string } }) {
    return this.notesService.getUserTags(req.user.id);
  }

  @Post('upload-url')
  @ApiOperation({
    summary: 'Create a signed upload URL for note images or attachments',
  })
  @ApiResponse({ status: 201, description: 'Signed upload URL created' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
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
  @ApiOperation({ summary: 'List trashed notes with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of trashed notes' })
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
  @ApiOperation({ summary: 'Permanently delete all trashed notes' })
  @ApiResponse({ status: 200, description: 'Trash emptied' })
  emptyTrash(@Request() req: { user: { id: string } }) {
    return this.notesService.emptyTrash(req.user.id);
  }

  @Get('trash/:id')
  @ApiOperation({ summary: 'Get a single trashed note by ID' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Trashed note details' })
  @ApiResponse({ status: 404, description: 'Note not found in trash' })
  findTrashedById(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.findTrashedById(id, req.user.id);
  }

  @Delete('trash/:id')
  @ApiOperation({ summary: 'Permanently delete a single trashed note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Note permanently deleted' })
  @ApiResponse({ status: 404, description: 'Note not found in trash' })
  permanentDelete(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.permanentDelete(id, req.user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history for a note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Paginated version history' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
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
  @ApiOperation({ summary: 'Get a specific version of a note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiParam({ name: 'versionId', description: 'Version ID' })
  @ApiResponse({
    status: 200,
    description: 'Version details with diff context',
  })
  @ApiResponse({ status: 404, description: 'Note or version not found' })
  getVersionById(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.getVersionById(id, versionId, req.user.id);
  }

  @Post(':id/versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore a note to a specific version' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiParam({ name: 'versionId', description: 'Version ID to restore' })
  @ApiResponse({ status: 201, description: 'Version restored' })
  @ApiResponse({ status: 404, description: 'Note or version not found' })
  @ApiResponse({ status: 403, description: 'Write access denied' })
  restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.restoreVersion(id, versionId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single note by ID' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Note details' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findById(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.notesService.findById(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: 201, description: 'Note created' })
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateNoteDto) {
    return this.notesService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note (with optimistic locking)' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Note updated' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  @ApiResponse({ status: 403, description: 'Write access denied' })
  update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a note (move to trash)' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Note moved to trash' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  softDelete(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notesService.softDelete(id, req.user.id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a note from trash' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 201, description: 'Note restored from trash' })
  @ApiResponse({ status: 404, description: 'Note not found in trash' })
  restore(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.notesService.restore(id, req.user.id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 201, description: 'Note archived' })
  @ApiResponse({ status: 400, description: 'Draft or already archived' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  archive(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.notesService.archive(id, req.user.id);
  }

  @Post(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive a note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 201, description: 'Note unarchived' })
  @ApiResponse({ status: 404, description: 'Archived note not found' })
  unarchive(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.notesService.unarchive(id, req.user.id);
  }
}
