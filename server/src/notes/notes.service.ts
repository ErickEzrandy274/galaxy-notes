import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

const MAX_VERSIONS = 20;
const ALLOWED_MIME_TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

@Injectable()
export class NotesService {
  private supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 10,
    filters?: { status?: string; search?: string; tags?: string[] },
  ) {
    const skip = (page - 1) * limit;

    const where: any = { userId, isDeleted: false };
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters?.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { shares: true } } },
      }),
      this.prisma.note.count({ where }),
    ]);
    return { notes, total, page, limit };
  }

  async findById(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, isDeleted: false },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        shares: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
    if (!note) throw new NotFoundException('Note not found');

    // Check access: owner or shared
    const isOwner = note.userId === userId;
    const isShared = note.shares.some((s) => s.userId === userId);
    if (!isOwner && !isShared) throw new ForbiddenException('Access denied');

    return note;
  }

  async create(
    userId: string,
    dto: {
      title: string;
      content?: string;
      status?: string;
      tags?: string[];
      videoUrl?: string;
      photo?: string;
    },
  ) {
    return this.prisma.note.create({
      data: {
        ...dto,
        status: (dto.status as any) || 'draft',
        userId,
      },
    });
  }

  async update(
    noteId: string,
    userId: string,
    dto: {
      title?: string;
      content?: string;
      status?: string;
      tags?: string[];
      videoUrl?: string;
      photo?: string;
      version: number;
    },
  ) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, isDeleted: false },
    });
    if (!note) throw new NotFoundException('Note not found');

    // Optimistic locking
    if (note.version !== dto.version) {
      throw new ConflictException({
        message: 'Note has been modified by another user',
        currentVersion: note.version,
      });
    }

    // Check write access
    const isOwner = note.userId === userId;
    if (!isOwner) {
      const share = await this.prisma.noteShare.findUnique({
        where: { noteId_userId: { noteId, userId } },
      });
      if (!share || share.permission !== 'WRITE') {
        throw new ForbiddenException('Write access denied');
      }
    }

    const { version, ...updateData } = dto;

    // Version tracking for non-draft notes
    if (note.status !== 'draft') {
      await this.createVersionSnapshot(noteId, note, userId);
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: { ...updateData, status: dto.status as any, version: note.version + 1 },
    });
  }

  async getUserTags(userId: string) {
    const notes = await this.prisma.note.findMany({
      where: { userId, isDeleted: false },
      select: { tags: true },
    });

    const tagCounts = new Map<string, number>();
    for (const note of notes) {
      for (const tag of note.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return {
      tags: Array.from(tagCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async createSignedUploadUrl(
    userId: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
  ) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        'Invalid file type. Only .webp, .jpg, and .png are allowed.',
      );
    }
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 1MB limit.');
    }

    const ext = fileName.split('.').pop();
    const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from('note-attachments')
      .createSignedUploadUrl(path);

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from('note-attachments').getPublicUrl(path);

    return { signedUrl: data.signedUrl, token: data.token, path, publicUrl };
  }

  private async createVersionSnapshot(
    noteId: string,
    note: { version: number; title: string; content: string | null },
    changedBy: string,
  ) {
    const versionCount = await this.prisma.noteVersion.count({
      where: { noteId },
    });

    if (versionCount >= MAX_VERSIONS) {
      const oldest = await this.prisma.noteVersion.findFirst({
        where: { noteId },
        orderBy: { version: 'asc' },
      });
      if (oldest) {
        await this.prisma.noteVersion.delete({ where: { id: oldest.id } });
      }
    }

    await this.prisma.noteVersion.create({
      data: {
        noteId,
        version: note.version,
        title: note.title,
        content: note.content ?? '',
        changedBy,
      },
    });
  }

  async softDelete(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
    });
    if (!note) throw new NotFoundException('Note not found');

    return this.prisma.$transaction([
      this.prisma.note.update({
        where: { id: noteId },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
      this.prisma.noteShare.deleteMany({ where: { noteId } }),
    ]);
  }

  async restore(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: true },
    });
    if (!note) throw new NotFoundException('Note not found in trash');

    return this.prisma.note.update({
      where: { id: noteId },
      data: { isDeleted: false, deletedAt: null, status: 'draft' },
    });
  }
}
