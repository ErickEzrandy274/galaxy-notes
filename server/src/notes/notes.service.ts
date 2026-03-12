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
const ALLOWED_MIME_TYPES_EDITOR = ['image/webp', 'image/jpeg', 'image/png'];
const ALLOWED_MIME_TYPES_ATTACHMENT = ['application/pdf'];
const MAX_FILE_SIZE_EDITOR = 1 * 1024 * 1024; // 1MB
const MAX_FILE_SIZE_ATTACHMENT = 3 * 1024 * 1024; // 3MB

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

  async getStats(userId: string) {
    const counts = await this.prisma.note.groupBy({
      by: ['status'],
      where: { userId, isDeleted: false },
      _count: { status: true },
    });

    const map = Object.fromEntries(
      counts.map((c) => [c.status, c._count.status]),
    );

    const total = Object.values(map).reduce(
      (a: number, b: number) => a + b,
      0,
    );

    return {
      total,
      published: map['published'] ?? 0,
      draft: map['draft'] ?? 0,
      archived: map['archived'] ?? 0,
      shared: map['shared'] ?? 0,
    };
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
        select: {
          id: true,
          title: true,
          status: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { shares: true } },
        },
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

    return {
      ...note,
      content: await this.resolveContentImages(note.content),
      photoUrl: await this.resolvePhotoUrl(note.photo),
    };
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
    const sanitizedDto = {
      ...dto,
      content: this.sanitizeContentUrls(dto.content),
    };

    return this.prisma.note.create({
      data: {
        ...sanitizedDto,
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
      photo?: string | null;
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

    // Sanitize photo: extract storage path if a full URL was sent
    if (updateData.photo && updateData.photo.startsWith('http')) {
      const match = updateData.photo.match(/\/galaxy-notes-staging\/([^?]+)/);
      updateData.photo = match ? decodeURIComponent(match[1]) : undefined;
    }

    // Delete old photo from storage when cleared or replaced
    if (note.photo && updateData.photo !== undefined && note.photo !== updateData.photo) {
      await this.supabase.storage
        .from('galaxy-notes-staging')
        .remove([note.photo]);
    }

    // Sanitize content: convert Supabase signed URLs to storage paths
    if (updateData.content) {
      updateData.content = this.sanitizeContentUrls(updateData.content);
    }

    // Delete orphaned images from storage
    if (updateData.content !== undefined) {
      const oldPaths = this.extractContentImagePaths(note.content);
      const newPaths = this.extractContentImagePaths(updateData.content);
      const removed = oldPaths.filter((p) => !newPaths.includes(p));
      if (removed.length > 0) {
        await this.supabase.storage
          .from('galaxy-notes-staging')
          .remove(removed);
      }
    }

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
    noteId: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
    source: 'rich-text-editor' | 'attachment',
  ) {
    const allowedTypes =
      source === 'attachment'
        ? ALLOWED_MIME_TYPES_ATTACHMENT
        : ALLOWED_MIME_TYPES_EDITOR;
    const maxSize =
      source === 'attachment'
        ? MAX_FILE_SIZE_ATTACHMENT
        : MAX_FILE_SIZE_EDITOR;

    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException(
        source === 'attachment'
          ? 'Invalid file type. Only .pdf files are allowed.'
          : 'Invalid file type. Only .webp, .jpg, and .png are allowed.',
      );
    }
    if (fileSize > maxSize) {
      throw new BadRequestException(
        `File size exceeds ${source === 'attachment' ? '3MB' : '1MB'} limit.`,
      );
    }

    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${source}/${noteId}/${Date.now()}_${sanitized}`;

    const { data, error } = await this.supabase.storage
      .from('galaxy-notes-staging')
      .createSignedUploadUrl(path);

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const downloadUrl = await this.resolvePhotoUrl(path);

    return {
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      downloadUrl,
    };
  }

  private async resolvePhotoUrl(
    photo: string | null,
  ): Promise<string | null> {
    if (!photo) return null;

    // Handle corrupted data: extract path from full signed URL
    let storagePath = photo;
    if (photo.startsWith('http')) {
      const match = photo.match(/\/galaxy-notes-staging\/([^?]+)/);
      if (match) {
        storagePath = decodeURIComponent(match[1]);
      } else {
        return null;
      }
    }

    const { data } = await this.supabase.storage
      .from('galaxy-notes-staging')
      .createSignedUrl(storagePath, 3600);
    return data?.signedUrl ?? null;
  }

  private extractContentImagePaths(content: string | null | undefined): string[] {
    if (!content) return [];
    const paths: string[] = [];
    const regex = /<img\s+src="([^"]+)"/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      const src = m[1];
      // Only collect storage paths (not URLs, blobs, or empty)
      if (!src || src.startsWith('http') || src.startsWith('blob:') || src === '//:0') continue;
      paths.push(src);
    }
    return paths;
  }

  private sanitizeContentUrls(content: string | undefined): string | undefined {
    if (!content) return content;

    // Strip images that still reference a local blob URL
    // (autosave fired while upload was in-flight)
    content = content.replace(/<img\s+src="blob:[^"]*"[^>]*>/g, '');

    // Strip images corrupted by blob URL revocation (//:0 artifact)
    content = content.replace(/<img\s+src="\/\/:0"[^>]*>/g, '');

    // Strip images with empty src (failed download URL)
    content = content.replace(/<img\s+src=""[^>]*>/g, '');

    return content.replace(
      /<img\s+src="(https?:\/\/[^"]*\/galaxy-notes-staging\/[^"]+)"/g,
      (match, url) => {
        const pathMatch = url.match(/\/galaxy-notes-staging\/([^?]+)/);
        if (pathMatch) {
          return `<img src="${decodeURIComponent(pathMatch[1])}"`;
        }
        return match;
      },
    );
  }

  private async resolveContentImages(
    content: string | null,
  ): Promise<string | null> {
    if (!content) return content;

    const imgRegex = /<img\s+src="([^"]+)"/g;
    const replacements: { from: string; to: string }[] = [];

    let m;
    while ((m = imgRegex.exec(content)) !== null) {
      const src = m[1];
      if (src.startsWith('http') || src.startsWith('blob:') || src === '//:0' || !src) continue;
      const signedUrl = await this.resolvePhotoUrl(src);
      if (signedUrl) {
        replacements.push({ from: m[0], to: `<img src="${signedUrl}"` });
      }
    }

    let result = content;
    for (const { from, to } of replacements) {
      result = result.replace(from, to);
    }
    return result;
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
