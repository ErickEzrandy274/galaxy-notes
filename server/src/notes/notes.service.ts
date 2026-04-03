import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NoteStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PreferencesService } from '../preferences/preferences.service';
import {
  NOTIFICATION_SEND,
  NotificationPayload,
} from '../notifications/events/notification.events';

const MAX_VERSIONS = 30;
const SNAPSHOT_THROTTLE_MS = 10 * 60 * 1000; // 10 minutes
const SNAPSHOT_DEDUP_MS = 30 * 1000; // 30 seconds — prevents duplicate versions from autosave + manual save race
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
    private readonly eventEmitter: EventEmitter2,
    private readonly preferencesService: PreferencesService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  /**
   * Resolve filter tag inputs to actual stored tags using case-insensitive partial matching.
   * e.g. filter "re" matches stored tags "React", "Recipe", etc.
   */
  private async resolveMatchingTags(
    filterTags: string[],
    where: { userId?: string; isDeleted?: boolean },
  ): Promise<string[]> {
    const notes = await this.prisma.note.findMany({
      where,
      select: { tags: true },
    });

    const allTags = new Set<string>();
    for (const note of notes) {
      for (const tag of note.tags) allTags.add(tag);
    }

    const matched = new Set<string>();
    for (const tag of allTags) {
      const lower = tag.toLowerCase();
      if (filterTags.some((f) => lower.includes(f.toLowerCase()))) {
        matched.add(tag);
      }
    }

    return Array.from(matched);
  }

  async getStats(userId: string) {
    const [counts, sharedCount] = await Promise.all([
      this.prisma.note.groupBy({
        by: ['status'],
        where: { userId, isDeleted: false },
        _count: { status: true },
      }),
      this.prisma.note.count({
        where: { userId, isDeleted: false, shares: { some: {} } },
      }),
    ]);

    const map = Object.fromEntries(
      counts.map((c) => [c.status, c._count.status]),
    );

    const total = Object.values(map).reduce((a: number, b: number) => a + b, 0);

    return {
      total,
      published: map['published'] ?? 0,
      draft: map['draft'] ?? 0,
      archived: map['archived'] ?? 0,
      shared: sharedCount,
    };
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 10,
    filters?: {
      status?: string;
      search?: string;
      tags?: string[];
      permission?: string;
      ownerSearch?: string;
    },
  ) {
    const skip = (page - 1) * limit;

    // Special filter: show notes shared with current user (not owned by them)
    if (filters?.status === 'shared') {
      const shareFilter: Prisma.NoteShareListRelationFilter['some'] = {
        userId,
      };
      if (filters?.permission) {
        shareFilter.permission =
          filters.permission as Prisma.EnumPermissionFilter;
      }

      const sharedWhere: Prisma.NoteWhereInput = {
        isDeleted: false,
        shares: { some: shareFilter },
        NOT: { userId },
      };
      if (filters?.search) {
        sharedWhere.title = { contains: filters.search, mode: 'insensitive' };
      }
      if (filters?.tags?.length) {
        const matchedTags = await this.resolveMatchingTags(filters.tags, {
          isDeleted: false,
        });
        sharedWhere.tags = matchedTags.length
          ? { hasSome: matchedTags }
          : { hasSome: ['__no_match__'] };
      }
      if (filters?.ownerSearch) {
        sharedWhere.user = {
          OR: [
            {
              firstName: {
                contains: filters.ownerSearch,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: filters.ownerSearch,
                mode: 'insensitive',
              },
            },
          ],
        };
      }

      const [notes, total] = await Promise.all([
        this.prisma.note.findMany({
          where: sharedWhere,
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
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
              },
            },
            shares: {
              where: { userId },
              select: { id: true, permission: true, createdAt: true },
            },
          },
        }),
        this.prisma.note.count({ where: sharedWhere }),
      ]);

      // Flatten share data for the current user
      const flatNotes = notes.map((note) => {
        const myShare = note.shares[0];
        return {
          id: note.id,
          title: note.title,
          status: note.status,
          tags: note.tags,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          owner: note.user,
          shareId: myShare?.id ?? null,
          permission: myShare?.permission ?? 'READ',
          sharedOn: myShare?.createdAt ?? note.createdAt,
        };
      });

      return { notes: flatNotes, total, page, limit };
    }

    const where: Prisma.NoteWhereInput = {
      userId,
      isDeleted: false,
      status: { not: 'archived' },
    };
    if (filters?.status === 'has_shares') {
      where.shares = { some: {} };
    } else if (filters?.status) {
      where.status = filters.status as NoteStatus;
    }
    if (filters?.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters?.tags?.length) {
      const matchedTags = await this.resolveMatchingTags(filters.tags, {
        userId,
        isDeleted: false,
      });
      where.tags = matchedTags.length
        ? { hasSome: matchedTags }
        : { hasSome: ['__no_match__'] };
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
          select: {
            id: true,
            userId: true,
            permission: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
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

    // Resolve content images and document URL in parallel
    const [resolvedContent, documentUrl] = await Promise.all([
      this.resolveContentImages(note.content),
      this.resolveDocumentUrl(note.document),
    ]);

    return {
      ...note,
      content: resolvedContent,
      documentUrl,
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
      document?: string;
    },
  ) {
    const sanitizedDto = {
      ...dto,
      content: this.sanitizeContentUrls(dto.content),
    };

    return this.prisma.note.create({
      data: {
        ...sanitizedDto,
        status: (dto.status as NoteStatus) || 'draft',
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
      document?: string | null;
      documentSize?: number | null;
      version: number;
      snapshot?: boolean;
    },
  ) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, isDeleted: false },
    });
    if (!note) throw new NotFoundException('Note not found');

    if (note.status === 'archived') {
      throw new BadRequestException(
        'Cannot edit an archived note. Unarchive it first.',
      );
    }

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
        select: { permission: true },
      });
      if (!share || share.permission !== 'WRITE') {
        throw new ForbiddenException('Write access denied');
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { version, snapshot, ...updateData } = dto;

    // Sanitize document: extract storage path if a full URL was sent
    if (updateData.document && updateData.document.startsWith('http')) {
      const match = updateData.document.match(
        /\/galaxy-notes-staging\/([^?]+)/,
      );
      updateData.document = match ? decodeURIComponent(match[1]) : undefined;
    }

    // Delete old document from storage when cleared or replaced
    if (
      note.document &&
      updateData.document !== undefined &&
      note.document !== updateData.document
    ) {
      await this.supabase.storage
        .from('galaxy-notes-staging')
        .remove([note.document]);
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
      const lastVersion = await this.prisma.noteVersion.findFirst({
        where: { noteId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      const elapsed = lastVersion
        ? Date.now() - lastVersion.createdAt.getTime()
        : Infinity;

      if (snapshot) {
        // Manual save / publish — create snapshot unless one was just created
        // (dedup window prevents double-versioning from autosave + manual save race)
        if (elapsed >= SNAPSHOT_DEDUP_MS) {
          await this.createVersionSnapshot(noteId, note, userId);
        }
      } else {
        // Autosave — only snapshot if last one is older than throttle window
        if (elapsed >= SNAPSHOT_THROTTLE_MS) {
          await this.createVersionSnapshot(noteId, note, userId);
        }
      }
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: {
        ...updateData,
        status: dto.status as NoteStatus,
        version: note.version + 1,
      },
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
      source === 'attachment' ? MAX_FILE_SIZE_ATTACHMENT : MAX_FILE_SIZE_EDITOR;

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

    const downloadUrl = await this.resolveDocumentUrl(path);

    return {
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      downloadUrl,
    };
  }

  private async resolveDocumentUrl(
    document: string | null,
  ): Promise<string | null> {
    if (!document) return null;

    // Handle corrupted data: extract path from full signed URL
    let storagePath = document;
    if (document.startsWith('http')) {
      const match = document.match(/\/galaxy-notes-staging\/([^?]+)/);
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

  private extractContentImagePaths(
    content: string | null | undefined,
  ): string[] {
    if (!content) return [];
    const paths: string[] = [];
    const regex = /<img\s+src="([^"]+)"/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      const src = m[1];
      // Only collect storage paths (not URLs, blobs, or empty)
      if (
        !src ||
        src.startsWith('http') ||
        src.startsWith('blob:') ||
        src === '//:0'
      )
        continue;
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
      (match, url: string) => {
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
    const matches: { fullMatch: string; src: string }[] = [];

    let m;
    while ((m = imgRegex.exec(content)) !== null) {
      const src = m[1];
      if (
        src.startsWith('http') ||
        src.startsWith('blob:') ||
        src === '//:0' ||
        !src
      )
        continue;
      matches.push({ fullMatch: m[0], src });
    }

    if (matches.length === 0) return content;

    // Resolve all signed URLs in parallel instead of sequentially
    const signedUrls = await Promise.all(
      matches.map((match) => this.resolveDocumentUrl(match.src)),
    );

    let result = content;
    for (let i = 0; i < matches.length; i++) {
      if (signedUrls[i]) {
        result = result.replace(
          matches[i].fullMatch,
          `<img src="${signedUrls[i]}"`,
        );
      }
    }
    return result;
  }

  private async createVersionSnapshot(
    noteId: string,
    note: {
      version: number;
      title: string;
      content: string | null;
      document?: string | null;
      documentSize?: number | null;
      videoUrl?: string | null;
      tags?: string[];
    },
    changedBy: string,
  ) {
    const versionCount = await this.prisma.noteVersion.count({
      where: { noteId },
    });

    if (versionCount >= MAX_VERSIONS) {
      const oldest = await this.prisma.noteVersion.findFirst({
        where: { noteId },
        orderBy: { version: 'asc' },
        select: { id: true },
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
        document: note.document ?? null,
        documentSize: note.documentSize ?? null,
        videoUrl: note.videoUrl ?? null,
        tags: note.tags ?? [],
      },
    });
  }

  async getVersionHistory(
    noteId: string,
    userId: string,
    cursor?: string,
    limit = 10,
  ) {
    // Verify note exists and user has access
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, isDeleted: false },
      select: {
        userId: true,
        shares: { select: { userId: true } },
      },
    });
    if (!note) throw new NotFoundException('Note not found');

    const isOwner = note.userId === userId;
    const isShared = note.shares.some((s) => s.userId === userId);
    if (!isOwner && !isShared) throw new ForbiddenException('Access denied');

    const where: Prisma.NoteVersionWhereInput = { noteId };
    if (cursor) {
      where.id = { lt: cursor };
    }

    // Fetch total count and version page in parallel
    const [totalVersions, versions] = await Promise.all([
      this.prisma.noteVersion.count({ where: { noteId } }),
      this.prisma.noteVersion.findMany({
        where,
        orderBy: { version: 'desc' },
        take: limit + 1,
        select: {
          id: true,
          version: true,
          title: true,
          changedBy: true,
          createdAt: true,
        },
      }),
    ]);

    const hasMore = versions.length > limit;
    if (hasMore) versions.pop();

    // Resolve changedBy user IDs to names (batch query)
    const userIds = [...new Set(versions.map((v) => v.changedBy))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = versions.map((v) => {
      const user = userMap.get(v.changedBy);
      const name = user
        ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown'
        : 'Unknown';
      return { ...v, changedByName: name };
    });

    return {
      versions: enriched,
      nextCursor: hasMore ? versions[versions.length - 1].id : null,
      hasMore,
      totalVersions,
    };
  }

  async getVersionById(noteId: string, versionId: string, userId: string) {
    // Verify note exists and user has access
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, isDeleted: false },
      select: {
        userId: true,
        content: true,
        title: true,
        document: true,
        documentSize: true,
        videoUrl: true,
        tags: true,
        status: true,
        shares: { select: { userId: true } },
      },
    });
    if (!note) throw new NotFoundException('Note not found');

    const isOwner = note.userId === userId;
    const isShared = note.shares.some((s) => s.userId === userId);
    if (!isOwner && !isShared) throw new ForbiddenException('Access denied');

    const version = await this.prisma.noteVersion.findFirst({
      where: { id: versionId, noteId },
    });
    if (!version) throw new NotFoundException('Version not found');

    // Resolve user name and all signed URLs in parallel
    const [
      changedByUser,
      versionContent,
      versionDocUrl,
      currentContent,
      currentDocUrl,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: version.changedBy },
        select: { firstName: true, lastName: true },
      }),
      this.resolveContentImages(version.content),
      this.resolveDocumentUrl(version.document),
      this.resolveContentImages(note.content),
      this.resolveDocumentUrl(note.document),
    ]);

    const changedByName = changedByUser
      ? [changedByUser.firstName, changedByUser.lastName]
          .filter(Boolean)
          .join(' ') || 'Unknown'
      : 'Unknown';

    return {
      ...version,
      changedByName,
      content: versionContent,
      documentUrl: versionDocUrl,
      currentContent,
      currentTitle: note.title,
      currentDocument: note.document,
      currentDocumentSize: note.documentSize,
      currentDocumentUrl: currentDocUrl,
      currentVideoUrl: note.videoUrl,
      currentTags: note.tags,
      noteStatus: note.status,
    };
  }

  async restoreVersion(noteId: string, versionId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, isDeleted: false },
      select: {
        id: true,
        userId: true,
        status: true,
        version: true,
        title: true,
        content: true,
        document: true,
        documentSize: true,
        videoUrl: true,
        tags: true,
      },
    });
    if (!note) throw new NotFoundException('Note not found');

    if (note.status === 'archived') {
      throw new BadRequestException(
        'Cannot restore versions on archived notes',
      );
    }

    // Check write access
    const isOwner = note.userId === userId;
    if (!isOwner) {
      const share = await this.prisma.noteShare.findUnique({
        where: { noteId_userId: { noteId, userId } },
        select: { permission: true },
      });
      if (!share || share.permission !== 'WRITE') {
        throw new ForbiddenException('Write access denied');
      }
    }

    const version = await this.prisma.noteVersion.findFirst({
      where: { id: versionId, noteId },
    });
    if (!version) throw new NotFoundException('Version not found');

    // Snapshot current state before restoring
    await this.createVersionSnapshot(noteId, note, userId);

    // Restore: overwrite note with version data
    return this.prisma.note.update({
      where: { id: noteId },
      data: {
        title: version.title,
        content: version.content,
        document: version.document,
        documentSize: version.documentSize,
        videoUrl: version.videoUrl ?? null,
        tags: version.tags ?? [],
        version: note.version + 1,
      },
    });
  }

  async softDelete(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
      select: {
        id: true,
        title: true,
        status: true,
        shares: { select: { userId: true } },
      },
    });
    if (!note) throw new NotFoundException('Note not found');

    if (note.status === 'archived') {
      throw new BadRequestException(
        'Cannot delete an archived note directly. Unarchive it first.',
      );
    }

    // Collect collaborators before deleting shares
    const collaboratorIds = note.shares
      .map((s) => s.userId)
      .filter((id) => id !== userId);

    await this.prisma.$transaction([
      this.prisma.note.update({
        where: { id: noteId },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
      this.prisma.noteShare.deleteMany({ where: { noteId } }),
    ]);

    // Notify collaborators that the shared note was deleted (non-blocking)
    for (const collaboratorId of collaboratorIds) {
      this.eventEmitter.emit(NOTIFICATION_SEND, {
        userId: collaboratorId,
        title: 'Shared Note Deleted',
        message: `A note '${note.title}' shared with you has been deleted by the owner`,
        type: 'trash',
        noteId,
        actorId: userId,
      } satisfies NotificationPayload);
    }

    const prefs = await this.preferencesService.getPreferences(userId);

    this.eventEmitter.emit(NOTIFICATION_SEND, {
      userId,
      title: 'Version History Scheduled for Deletion',
      message: `The version history of Note '${note.title}' will be permanently deleted after ${prefs.trashRetentionDays} days`,
      type: 'version_cleanup',
      noteId,
    } satisfies NotificationPayload);
  }

  async restore(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: true },
      select: { id: true, title: true },
    });
    if (!note) throw new NotFoundException('Note not found in trash');

    const restored = await this.prisma.note.update({
      where: { id: noteId },
      data: { isDeleted: false, deletedAt: null, status: 'draft' },
    });

    this.eventEmitter.emit(NOTIFICATION_SEND, {
      userId,
      title: 'Note Restored',
      message: `Note '${note.title || 'Untitled'}' has been restored as a draft`,
      type: 'restore',
      noteId,
    } satisfies NotificationPayload);

    return restored;
  }

  async findTrashedById(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: true },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!note) throw new NotFoundException('Note not found in trash');

    const [resolvedContent, documentUrl] = await Promise.all([
      this.resolveContentImages(note.content),
      this.resolveDocumentUrl(note.document),
    ]);

    return {
      ...note,
      content: resolvedContent,
      documentUrl,
      shares: [],
    };
  }

  async findTrashed(
    userId: string,
    page = 1,
    limit = 10,
    filters?: { search?: string; tags?: string[] },
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.NoteWhereInput = { userId, isDeleted: true };
    if (filters?.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters?.tags?.length) {
      const matchedTags = await this.resolveMatchingTags(filters.tags, {
        userId,
        isDeleted: true,
      });
      where.tags = matchedTags.length
        ? { hasSome: matchedTags }
        : { hasSome: ['__no_match__'] };
    }

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        orderBy: { deletedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          tags: true,
          createdAt: true,
          deletedAt: true,
        },
      }),
      this.prisma.note.count({ where }),
    ]);

    return { notes, total, page, limit };
  }

  async permanentDelete(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: true },
      select: { id: true, content: true, document: true },
    });
    if (!note) throw new NotFoundException('Note not found in trash');

    await this.cleanupNoteStorage(note);

    await this.prisma.note.delete({ where: { id: noteId } });
  }

  async emptyTrash(userId: string) {
    const trashedNotes = await this.prisma.note.findMany({
      where: { userId, isDeleted: true },
      select: { id: true, content: true, document: true },
    });

    if (trashedNotes.length === 0) return { deleted: 0 };

    await Promise.all(
      trashedNotes.map((note) => this.cleanupNoteStorage(note)),
    );

    const { count } = await this.prisma.note.deleteMany({
      where: { userId, isDeleted: true },
    });

    return { deleted: count };
  }

  async archive(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
      select: {
        id: true,
        title: true,
        status: true,
        shares: { select: { userId: true } },
      },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.status === 'draft') {
      throw new BadRequestException('Draft notes cannot be archived');
    }
    if (note.status === 'archived') {
      throw new BadRequestException('Note is already archived');
    }

    const collaboratorIds = note.shares
      .map((s) => s.userId)
      .filter((id) => id !== userId);

    const [updated] = await this.prisma.$transaction([
      this.prisma.note.update({
        where: { id: noteId },
        data: {
          status: 'archived',
          previousStatus: note.status,
          previousCollaboratorIds: collaboratorIds,
        },
      }),
      this.prisma.noteShare.deleteMany({ where: { noteId } }),
    ]);

    for (const collaboratorId of collaboratorIds) {
      this.eventEmitter.emit(NOTIFICATION_SEND, {
        userId: collaboratorId,
        title: 'Shared Note Archived',
        message: `A note '${note.title}' shared with you has been archived by the owner`,
        type: 'archive',
        noteId,
        actorId: userId,
      } satisfies NotificationPayload);
    }

    return updated;
  }

  async unarchive(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false, status: 'archived' },
      select: {
        id: true,
        title: true,
        previousStatus: true,
        previousCollaboratorIds: true,
      },
    });
    if (!note) throw new NotFoundException('Archived note not found');

    // Restore to previous status; if it was 'shared', use 'published' since shares were revoked
    let restoredStatus = note.previousStatus ?? 'draft';
    if (restoredStatus === 'shared') {
      restoredStatus = 'published';
    }

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        status: restoredStatus,
        previousStatus: null,
        previousCollaboratorIds: [],
      },
    });

    this.eventEmitter.emit(NOTIFICATION_SEND, {
      userId,
      title: 'Note Unarchived',
      message: `Note '${note.title || 'Untitled'}' has been restored as ${restoredStatus}`,
      type: 'restore',
      noteId,
    } satisfies NotificationPayload);

    // Notify previous collaborators that the note is available again (non-blocking)
    const ownerName = await this.prisma.user
      .findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      })
      .then(
        (u) =>
          [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'The owner',
      );

    for (const collaboratorId of note.previousCollaboratorIds) {
      this.eventEmitter.emit(NOTIFICATION_SEND, {
        userId: collaboratorId,
        title: 'Note Available Again',
        message: `${ownerName} unarchived the note '${note.title || 'Untitled'}'. The note is now available as read-only. You may request access again.`,
        type: 'restore',
        noteId,
        actorId: userId,
      } satisfies NotificationPayload);
    }

    return updated;
  }

  async cleanupNoteStorage(note: {
    content?: string | null;
    document?: string | null;
  }) {
    const paths: string[] = [];

    if (note.document) {
      paths.push(note.document);
    }

    const contentPaths = this.extractContentImagePaths(note.content);
    paths.push(...contentPaths);

    if (paths.length > 0) {
      await this.supabase.storage.from('galaxy-notes-staging').remove(paths);
    }
  }
}
