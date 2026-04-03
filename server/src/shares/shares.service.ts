import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { BulkAddSharesDto } from './dto/bulk-add-shares.dto';
import { UpdateSharePermissionDto } from './dto/update-share-permission.dto';
import {
  NOTIFICATION_SEND,
  NotificationPayload,
} from '../notifications/events/notification.events';

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const NOTIFICATION_DEBOUNCE_MS = 15 * 60 * 1000; // 15 minutes
const MAX_NOTIFICATIONS_PER_HOUR = 4;

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async addShares(userId: string, dto: BulkAddSharesDto) {
    const note = await this.prisma.note.findFirst({
      where: { id: dto.noteId, isDeleted: false },
      select: {
        id: true,
        title: true,
        status: true,
        userId: true,
        updatedAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId)
      throw new ForbiddenException('Only the note owner can share');
    if (note.status === 'draft')
      throw new BadRequestException('Publish the note before sharing');
    if (note.status === 'archived')
      throw new BadRequestException('Cannot share an archived note');

    // Filter out self-sharing and collect emails for batch lookup
    const recipientEmails = dto.recipients
      .filter((r) => r.email !== note.user.email)
      .map((r) => r.email);

    if (recipientEmails.length === 0) return { shared: [], invited: [] };

    // Batch-fetch all existing users by email (eliminates N+1)
    const existingUsers = await this.prisma.user.findMany({
      where: { email: { in: recipientEmails } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    const userByEmail = new Map(existingUsers.map((u) => [u.email, u]));

    // Batch-fetch existing shares for this note (eliminates N+1)
    const existingShares = await this.prisma.noteShare.findMany({
      where: {
        noteId: dto.noteId,
        userId: { in: existingUsers.map((u) => u.id) },
      },
      select: { id: true, userId: true, permission: true, noteId: true, createdAt: true, lastNotifiedAt: true },
    });
    const shareByUserId = new Map(existingShares.map((s) => [s.userId, s]));

    // Batch-fetch existing pending invites for unregistered emails (eliminates N+1)
    const unregisteredEmails = recipientEmails.filter((e) => !userByEmail.has(e));
    const existingInvites = unregisteredEmails.length > 0
      ? await this.prisma.noteInvite.findMany({
          where: {
            noteId: dto.noteId,
            email: { in: unregisteredEmails },
            acceptedAt: null,
          },
        })
      : [];
    const inviteByEmail = new Map(existingInvites.map((i) => [i.email, i]));

    const shared: any[] = [];
    const invited: any[] = [];

    for (const recipient of dto.recipients) {
      if (recipient.email === note.user.email) {
        continue; // Skip sharing with self
      }

      const targetUser = userByEmail.get(recipient.email);

      if (targetUser) {
        const existing = shareByUserId.get(targetUser.id);

        if (existing) {
          // Update permission if different
          if (
            recipient.permission &&
            existing.permission !== recipient.permission
          ) {
            await this.prisma.noteShare.update({
              where: { id: existing.id },
              data: { permission: recipient.permission as any },
            });
          }
          shared.push({ ...existing, user: targetUser });
          continue;
        }

        const noteShare = await this.prisma.noteShare.create({
          data: {
            noteId: dto.noteId,
            userId: targetUser.id,
            permission: (recipient.permission as any) || 'READ',
          },
          select: {
            id: true,
            noteId: true,
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
        });

        shared.push(noteShare);

        // Send notification with debouncing
        await this.sendShareNotification(targetUser.id, note, userId);

        // Update note status to shared if currently published
        if (note.status === 'published') {
          await this.prisma.note.update({
            where: { id: dto.noteId },
            data: { status: 'shared' },
          });
        }
      } else {
        // User not found — create invite
        const existingInvite = inviteByEmail.get(recipient.email);

        if (existingInvite) {
          invited.push(existingInvite);
          continue;
        }

        const token = randomBytes(32).toString('hex');
        const invite = await this.prisma.noteInvite.create({
          data: {
            token,
            email: recipient.email,
            noteId: dto.noteId,
            permission: (recipient.permission as any) || 'READ',
            invitedBy: userId,
            expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
          },
        });

        invited.push(invite);

        const sharerName =
          [note.user.firstName, note.user.lastName].filter(Boolean).join(' ') ||
          note.user.email;

        await this.mailService.sendShareInviteEmail(recipient.email, {
          sharerName,
          noteTitle: note.title,
          noteUpdatedAt: note.updatedAt,
          token,
        });
      }
    }

    return { shared, invited };
  }

  async getSharesForNote(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, isDeleted: false },
      select: { userId: true },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException('Access denied');

    // Fetch shares and pending invites in parallel
    const [shares, pendingInvites] = await Promise.all([
      this.prisma.noteShare.findMany({
        where: { noteId },
        include: {
          user: {
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
      }),
      this.prisma.noteInvite.findMany({
        where: { noteId, acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { shares, pendingInvites };
  }

  async updatePermission(
    shareId: string,
    userId: string,
    dto: UpdateSharePermissionDto,
  ) {
    const share = await this.prisma.noteShare.findUnique({
      where: { id: shareId },
      select: {
        id: true,
        userId: true,
        permission: true,
        note: { select: { id: true, userId: true, title: true } },
      },
    });
    if (!share) throw new NotFoundException('Share not found');
    if (share.note.userId !== userId)
      throw new ForbiddenException(
        'Only the note owner can update permissions',
      );

    const oldPermission = share.permission;

    const updated = await this.prisma.noteShare.update({
      where: { id: shareId },
      data: { permission: dto.permission as any },
    });

    if (oldPermission !== dto.permission) {
      await this.sendPermissionChangeNotification(
        share.userId,
        share.note,
        userId,
        dto.permission,
      );
    }

    return updated;
  }

  async removeShare(shareId: string, userId: string) {
    const share = await this.prisma.noteShare.findUnique({
      where: { id: shareId },
      select: {
        id: true,
        userId: true,
        note: {
          select: { id: true, userId: true, status: true, title: true },
        },
      },
    });
    if (!share) throw new NotFoundException('Share not found');

    const isOwner = share.note.userId === userId;
    const isRecipient = share.userId === userId;
    if (!isOwner && !isRecipient)
      throw new ForbiddenException('Access denied');

    await this.prisma.noteShare.delete({ where: { id: shareId } });

    // Notify the removed user when the owner revokes access
    if (isOwner) {
      await this.sendRevokeNotification(
        share.userId,
        share.note,
        userId,
      );
    }

    // Notify the owner when a recipient leaves
    if (isRecipient) {
      await this.sendLeaveNotification(
        share.note.userId,
        share.note,
        userId,
      );
    }

    // Check if any shares remain; if not, revert status from shared to published
    if (share.note.status === 'shared') {
      const remainingShares = await this.prisma.noteShare.count({
        where: { noteId: share.note.id },
      });
      if (remainingShares === 0) {
        await this.prisma.note.update({
          where: { id: share.note.id },
          data: { status: 'published' },
        });
      }
    }

    return { message: 'Share removed' };
  }

  async removeInvite(inviteId: string, userId: string) {
    const invite = await this.prisma.noteInvite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        note: { select: { userId: true } },
      },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.note.userId !== userId)
      throw new ForbiddenException('Only the note owner can remove invites');

    await this.prisma.noteInvite.delete({ where: { id: inviteId } });
    return { message: 'Invite removed' };
  }

  async requestAccess(noteId: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, isDeleted: false },
      select: { id: true, title: true, userId: true },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId === userId)
      throw new BadRequestException('You are the owner of this note');

    // Check existing access and recent request in parallel
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [existingShare, recentRequest] = await Promise.all([
      this.prisma.noteShare.findUnique({
        where: { noteId_userId: { noteId, userId } },
        select: { id: true },
      }),
      this.prisma.notification.findFirst({
        where: {
          userId: note.userId,
          actorId: userId,
          noteId,
          type: 'access_request',
          createdAt: { gt: oneHourAgo },
        },
        select: { id: true },
      }),
    ]);
    if (existingShare)
      throw new BadRequestException('You already have access to this note');
    if (recentRequest)
      throw new BadRequestException(
        'Access request already sent. Please wait before requesting again.',
      );

    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    const requesterName = requester
      ? [requester.firstName, requester.lastName].filter(Boolean).join(' ') ||
        requester.email
      : 'Someone';

    this.eventEmitter.emit(NOTIFICATION_SEND, {
      userId: note.userId,
      title: 'Access Requested',
      message: `${requesterName} requested access to your note '${note.title}'`,
      type: 'access_request',
      noteId,
      actorId: userId,
    } satisfies NotificationPayload);

    return { message: 'Access request sent' };
  }

  async grantAccess(
    noteId: string,
    requesterId: string,
    ownerId: string,
    permission: 'READ' | 'WRITE' = 'READ',
  ) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId: ownerId, isDeleted: false },
      select: { id: true, title: true, status: true, userId: true },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.status === 'archived')
      throw new BadRequestException('Cannot share an archived note');

    const existingShare = await this.prisma.noteShare.findUnique({
      where: { noteId_userId: { noteId, userId: requesterId } },
      select: { id: true },
    });
    if (existingShare)
      throw new BadRequestException('User already has access');

    await this.prisma.noteShare.create({
      data: { noteId, userId: requesterId, permission },
    });

    // Update note status to shared if currently published
    if (note.status === 'published') {
      await this.prisma.note.update({
        where: { id: noteId },
        data: { status: 'shared' },
      });
    }

    await this.sendShareNotification(requesterId, note, ownerId);

    // Mark the original access_request notification as resolved
    await this.prisma.notification.updateMany({
      where: {
        userId: ownerId,
        noteId,
        actorId: requesterId,
        type: 'access_request',
      },
      data: { type: 'access_granted' },
    });

    return { message: 'Access granted' };
  }

  async declineAccess(noteId: string, requesterId: string, ownerId: string) {
    // Fetch note and owner in parallel
    const [note, owner] = await Promise.all([
      this.prisma.note.findFirst({
        where: { id: noteId, userId: ownerId, isDeleted: false },
        select: { id: true, title: true },
      }),
      this.prisma.user.findUnique({
        where: { id: ownerId },
        select: { firstName: true, lastName: true, email: true },
      }),
    ]);
    if (!note) throw new NotFoundException('Note not found');
    const ownerName = owner
      ? [owner.firstName, owner.lastName].filter(Boolean).join(' ') ||
        owner.email
      : 'The owner';

    this.eventEmitter.emit(NOTIFICATION_SEND, {
      userId: requesterId,
      title: 'Access Request Declined',
      message: `${ownerName} declined your access request for note '${note.title}'`,
      type: 'access_declined',
      noteId,
      actorId: ownerId,
    } satisfies NotificationPayload);

    // Mark the original access_request notification as resolved
    await this.prisma.notification.updateMany({
      where: {
        userId: ownerId,
        noteId,
        actorId: requesterId,
        type: 'access_request',
      },
      data: { type: 'access_declined_by_owner' },
    });

    return { message: 'Access request declined' };
  }

  private async sendShareNotification(
    targetUserId: string,
    note: { id: string; title: string; userId: string },
    sharerId: string,
  ) {
    // Debounce check, rate limit, and sharer lookup in parallel
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [share, recentCount, sharer] = await Promise.all([
      this.prisma.noteShare.findUnique({
        where: { noteId_userId: { noteId: note.id, userId: targetUserId } },
        select: { lastNotifiedAt: true },
      }),
      this.prisma.notification.count({
        where: {
          userId: targetUserId,
          noteId: note.id,
          type: 'share',
          createdAt: { gt: oneHourAgo },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: sharerId },
        select: { firstName: true, lastName: true, email: true },
      }),
    ]);

    if (share?.lastNotifiedAt) {
      const elapsed = Date.now() - share.lastNotifiedAt.getTime();
      if (elapsed < NOTIFICATION_DEBOUNCE_MS) return;
    }

    if (recentCount >= MAX_NOTIFICATIONS_PER_HOUR) return;
    const sharerName = sharer
      ? [sharer.firstName, sharer.lastName].filter(Boolean).join(' ') ||
        sharer.email
      : 'Someone';

    this.eventEmitter.emit(NOTIFICATION_SEND, {
      userId: targetUserId,
      title: 'Note Shared With You',
      message: `${sharerName} shared the note '${note.title}' with you`,
      type: 'share',
      noteId: note.id,
      actorId: sharerId,
    } satisfies NotificationPayload);

    // Update lastNotifiedAt
    await this.prisma.noteShare.update({
      where: { noteId_userId: { noteId: note.id, userId: targetUserId } },
      data: { lastNotifiedAt: new Date() },
    });
  }

  private async sendPermissionChangeNotification(
    targetUserId: string,
    note: { id: string; title: string; userId: string },
    actorId: string,
    newPermission: string,
  ) {
    // Debounce check, rate limit, and actor lookup in parallel
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [share, recentCount, actor] = await Promise.all([
      this.prisma.noteShare.findUnique({
        where: { noteId_userId: { noteId: note.id, userId: targetUserId } },
        select: { lastNotifiedAt: true },
      }),
      this.prisma.notification.count({
        where: {
          userId: targetUserId,
          noteId: note.id,
          type: 'permission_change',
          createdAt: { gt: oneHourAgo },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: actorId },
        select: { firstName: true, lastName: true, email: true },
      }),
    ]);

    if (share?.lastNotifiedAt) {
      const elapsed = Date.now() - share.lastNotifiedAt.getTime();
      if (elapsed < NOTIFICATION_DEBOUNCE_MS) return;
    }

    if (recentCount >= MAX_NOTIFICATIONS_PER_HOUR) return;
    const actorName = actor
      ? [actor.firstName, actor.lastName].filter(Boolean).join(' ') ||
        actor.email
      : 'Someone';

    this.eventEmitter.emit(NOTIFICATION_SEND, {
      userId: targetUserId,
      title: 'Permission Updated',
      message: `${actorName} updated your permission to '${newPermission}' for note '${note.title}'`,
      type: 'permission_change',
      noteId: note.id,
      actorId,
    } satisfies NotificationPayload);

    // Update lastNotifiedAt
    await this.prisma.noteShare.update({
      where: { noteId_userId: { noteId: note.id, userId: targetUserId } },
      data: { lastNotifiedAt: new Date() },
    });
  }

  private async sendLeaveNotification(
    ownerId: string,
    note: { id: string; title: string },
    leavingUserId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: leavingUserId },
      select: { firstName: true, lastName: true, email: true },
    });
    const userName = user
      ? [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.email
      : 'Someone';

    this.eventEmitter.emit(NOTIFICATION_SEND, {
      userId: ownerId,
      title: 'Collaborator Left',
      message: `${userName} left the note '${note.title}'`,
      type: 'leave',
      noteId: note.id,
      actorId: leavingUserId,
    } satisfies NotificationPayload);
  }

  private async sendRevokeNotification(
    removedUserId: string,
    note: { id: string; title: string; userId: string },
    ownerId: string,
  ) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { firstName: true, lastName: true, email: true },
    });
    const ownerName = owner
      ? [owner.firstName, owner.lastName].filter(Boolean).join(' ') ||
        owner.email
      : 'Someone';

    this.eventEmitter.emit(NOTIFICATION_SEND, {
      userId: removedUserId,
      title: 'Access Revoked',
      message: `${ownerName} revoked your access to the note '${note.title}'`,
      type: 'revoke',
      noteId: note.id,
      actorId: ownerId,
    } satisfies NotificationPayload);
  }
}
