import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly userStreams = new Map<string, Subject<MessageEvent>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  // ── SSE Streaming ─────────────────────────────────────────

  getStream(userId: string): Observable<MessageEvent> {
    if (!this.userStreams.has(userId)) {
      this.userStreams.set(userId, new Subject<MessageEvent>());
    }
    return this.userStreams.get(userId)!.asObservable();
  }

  removeStream(userId: string) {
    this.userStreams.get(userId)?.complete();
    this.userStreams.delete(userId);
  }

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    noteId?: string;
    actorId?: string;
  }) {
    const notification = await this.prisma.notification.create({ data });

    // Push to SSE stream if user is connected
    const stream = this.userStreams.get(data.userId);
    if (stream) {
      stream.next({ data: notification } as unknown as MessageEvent);
    }

    return notification;
  }

  async findAllByUser(
    userId: string,
    page = 1,
    limit = 10,
    filter?: string,
  ) {
    const skip = (page - 1) * limit;

    // Get active (non-expired) muted user IDs
    const mutes = await this.prisma.notificationMute.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { mutedUserId: true },
    });
    const mutedUserIds = mutes.map((m) => m.mutedUserId);

    const where: any = { userId };

    // Exclude notifications from muted users
    if (mutedUserIds.length > 0) {
      where.OR = [
        { actorId: null },
        { actorId: { notIn: mutedUserIds } },
      ];
    }

    // Apply filter
    if (filter === 'unread') {
      where.isRead = false;
    } else if (filter === 'shared') {
      where.type = 'share';
    }

    const [raw, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              photo: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    // Enrich version_cleanup / restore notifications with note availability
    const stateTypes = ['version_cleanup', 'restore'];
    const noteIds = [
      ...new Set(
        raw
          .filter((n) => n.noteId && stateTypes.includes(n.type))
          .map((n) => n.noteId!),
      ),
    ];

    let noteStateMap = new Map<string, boolean>();
    if (noteIds.length > 0) {
      const notes = await this.prisma.note.findMany({
        where: { id: { in: noteIds } },
        select: { id: true, isDeleted: true },
      });
      noteStateMap = new Map(notes.map((n) => [n.id, n.isDeleted]));
    }

    const notifications = await Promise.all(
      raw.map(async (n) => {
        const resolved = {
          ...n,
          actor: n.actor
            ? {
                ...n.actor,
                photo: await this.usersService.resolvePhotoUrl(n.actor.photo),
              }
            : null,
        };

        if (!n.noteId || !stateTypes.includes(n.type)) return resolved;

        const isDeleted = noteStateMap.get(n.noteId);
        if (isDeleted === undefined)
          return { ...resolved, isNoteAvailable: false };
        const isNoteAvailable =
          n.type === 'version_cleanup' ? isDeleted : !isDeleted;
        return { ...resolved, isNoteAvailable };
      }),
    );

    return { notifications, total, page, limit };
  }

  async countUnread(userId: string) {
    // Get active (non-expired) muted user IDs
    const mutes = await this.prisma.notificationMute.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { mutedUserId: true },
    });
    const mutedUserIds = mutes.map((m) => m.mutedUserId);

    const where: any = { userId, isRead: false };

    if (mutedUserIds.length > 0) {
      where.OR = [
        { actorId: null },
        { actorId: { notIn: mutedUserIds } },
      ];
    }

    const count = await this.prisma.notification.count({ where });
    return { count };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async remove(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
    return { message: 'Notification removed' };
  }

  async muteUser(
    userId: string,
    mutedUserId: string,
    duration?: '1h' | '1d' | '1w' | 'forever',
  ) {
    if (userId === mutedUserId) {
      throw new BadRequestException('Cannot mute yourself');
    }

    const expiresAt = this.computeExpiresAt(duration);

    const existing = await this.prisma.notificationMute.findUnique({
      where: { userId_mutedUserId: { userId, mutedUserId } },
    });

    if (existing) {
      await this.prisma.notificationMute.update({
        where: { id: existing.id },
        data: { expiresAt },
      });
      return { message: 'Mute duration updated' };
    }

    await this.prisma.notificationMute.create({
      data: { userId, mutedUserId, expiresAt },
    });
    return { message: 'User muted' };
  }

  private computeExpiresAt(
    duration?: '1h' | '1d' | '1w' | 'forever',
  ): Date | null {
    if (!duration || duration === 'forever') return null;

    const now = new Date();
    const ms: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };
    return new Date(now.getTime() + ms[duration]);
  }

  async unmuteUser(userId: string, mutedUserId: string) {
    const existing = await this.prisma.notificationMute.findUnique({
      where: { userId_mutedUserId: { userId, mutedUserId } },
    });
    if (!existing) {
      throw new NotFoundException('Mute not found');
    }

    await this.prisma.notificationMute.delete({
      where: { id: existing.id },
    });
    return { message: 'User unmuted' };
  }

  async getMutedUsers(userId: string) {
    const mutes = await this.prisma.notificationMute.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        expiresAt: true,
        createdAt: true,
        mutedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      mutes.map(async (m) => ({
        ...m,
        mutedUser: {
          ...m.mutedUser,
          photo: await this.usersService.resolvePhotoUrl(m.mutedUser.photo),
        },
      })),
    );
  }
}
