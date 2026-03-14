import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { BulkAddSharesDto } from './dto/bulk-add-shares.dto';
import { UpdateSharePermissionDto } from './dto/update-share-permission.dto';

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const NOTIFICATION_DEBOUNCE_MS = 15 * 60 * 1000; // 15 minutes
const MAX_NOTIFICATIONS_PER_HOUR = 4;

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async addShares(userId: string, dto: BulkAddSharesDto) {
    const note = await this.prisma.note.findFirst({
      where: { id: dto.noteId, isDeleted: false },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId)
      throw new ForbiddenException('Only the note owner can share');
    if (note.status === 'draft')
      throw new BadRequestException('Publish the note before sharing');

    const shared: any[] = [];
    const invited: any[] = [];

    for (const recipient of dto.recipients) {
      if (recipient.email === note.user.email) {
        continue; // Skip sharing with self
      }

      const targetUser = await this.prisma.user.findUnique({
        where: { email: recipient.email },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (targetUser) {
        // Check if share already exists
        const existing = await this.prisma.noteShare.findUnique({
          where: {
            noteId_userId: { noteId: dto.noteId, userId: targetUser.id },
          },
        });

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
          include: {
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
        const existingInvite = await this.prisma.noteInvite.findFirst({
          where: {
            email: recipient.email,
            noteId: dto.noteId,
            acceptedAt: null,
          },
        });

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
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException('Access denied');

    const shares = await this.prisma.noteShare.findMany({
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
    });

    const pendingInvites = await this.prisma.noteInvite.findMany({
      where: { noteId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return { shares, pendingInvites };
  }

  async updatePermission(
    shareId: string,
    userId: string,
    dto: UpdateSharePermissionDto,
  ) {
    const share = await this.prisma.noteShare.findUnique({
      where: { id: shareId },
      include: {
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
      include: {
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
      include: { note: { select: { userId: true } } },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.note.userId !== userId)
      throw new ForbiddenException('Only the note owner can remove invites');

    await this.prisma.noteInvite.delete({ where: { id: inviteId } });
    return { message: 'Invite removed' };
  }

  private async sendShareNotification(
    targetUserId: string,
    note: { id: string; title: string; userId: string },
    sharerId: string,
  ) {
    // Debounce: check lastNotifiedAt
    const share = await this.prisma.noteShare.findUnique({
      where: { noteId_userId: { noteId: note.id, userId: targetUserId } },
    });

    if (share?.lastNotifiedAt) {
      const elapsed = Date.now() - share.lastNotifiedAt.getTime();
      if (elapsed < NOTIFICATION_DEBOUNCE_MS) return;
    }

    // Rate limit: max 4 per hour per note per collaborator
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.prisma.notification.count({
      where: {
        userId: targetUserId,
        noteId: note.id,
        type: 'share',
        createdAt: { gt: oneHourAgo },
      },
    });

    if (recentCount >= MAX_NOTIFICATIONS_PER_HOUR) return;

    const sharer = await this.prisma.user.findUnique({
      where: { id: sharerId },
      select: { firstName: true, lastName: true, email: true },
    });
    const sharerName = sharer
      ? [sharer.firstName, sharer.lastName].filter(Boolean).join(' ') ||
        sharer.email
      : 'Someone';

    await this.notificationsService.create({
      userId: targetUserId,
      title: 'Note Shared With You',
      message: `${sharerName} shared the note '${note.title}' with you`,
      type: 'share',
      noteId: note.id,
      actorId: sharerId,
    });

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
    // Debounce: check lastNotifiedAt
    const share = await this.prisma.noteShare.findUnique({
      where: { noteId_userId: { noteId: note.id, userId: targetUserId } },
    });

    if (share?.lastNotifiedAt) {
      const elapsed = Date.now() - share.lastNotifiedAt.getTime();
      if (elapsed < NOTIFICATION_DEBOUNCE_MS) return;
    }

    // Rate limit: max 4 per hour per note per collaborator
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.prisma.notification.count({
      where: {
        userId: targetUserId,
        noteId: note.id,
        type: 'permission_change',
        createdAt: { gt: oneHourAgo },
      },
    });

    if (recentCount >= MAX_NOTIFICATIONS_PER_HOUR) return;

    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { firstName: true, lastName: true, email: true },
    });
    const actorName = actor
      ? [actor.firstName, actor.lastName].filter(Boolean).join(' ') ||
        actor.email
      : 'Someone';

    await this.notificationsService.create({
      userId: targetUserId,
      title: 'Permission Updated',
      message: `${actorName} updated your permission to '${newPermission}' for note '${note.title}'`,
      type: 'permission_change',
      noteId: note.id,
      actorId,
    });

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

    await this.notificationsService.create({
      userId: ownerId,
      title: 'Collaborator Left',
      message: `${userName} left the note '${note.title}'`,
      type: 'leave',
      noteId: note.id,
      actorId: leavingUserId,
    });
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

    await this.notificationsService.create({
      userId: removedUserId,
      title: 'Access Revoked',
      message: `${ownerName} revoked your access to the note '${note.title}'`,
      type: 'revoke',
      noteId: note.id,
      actorId: ownerId,
    });
  }
}
