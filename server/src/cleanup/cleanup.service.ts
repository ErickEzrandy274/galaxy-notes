import { Injectable } from '@nestjs/common';
import { AppLogger } from '../common/logger/app.logger';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotesService } from '../notes/notes.service';
import { PreferencesService } from '../preferences/preferences.service';
import {
  NOTIFICATION_SEND,
  NotificationPayload,
} from '../notifications/events/notification.events';

const DEFAULT_RETENTION_DAYS = 30;

@Injectable()
export class CleanupService {
  private readonly logger = new AppLogger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notesService: NotesService,
    private readonly preferencesService: PreferencesService,
  ) {}

  @Cron('0 3 * * 0') // Sunday 3:00 AM
  async handleCleanup() {
    this.logger.log('Starting scheduled cleanup...');
    // purgeStaleNoteVersions must run first (modifies notes)
    await this.purgeStaleNoteVersions();
    // These three are independent — run in parallel
    await Promise.all([
      this.purgeExpiredTokens(),
      this.purgeExpiredInvites(),
      this.purgeExpiredMutes(),
    ]);
    this.logger.log('Scheduled cleanup complete.');
  }

  async purgeStaleNoteVersions() {
    // Get distinct user IDs with trashed notes
    const trashedNotes = await this.prisma.note.findMany({
      where: { isDeleted: true },
      select: { id: true, title: true, userId: true, deletedAt: true, content: true, document: true },
    });

    if (trashedNotes.length === 0) {
      this.logger.log('No trashed notes to process.');
      return;
    }

    // Get unique user IDs and batch-fetch their preferences in parallel
    const userIds = [...new Set(trashedNotes.map((n) => n.userId))];
    const prefsEntries = await Promise.all(
      userIds.map(async (userId) => {
        const prefs = await this.preferencesService.getPreferences(userId);
        return [userId, prefs] as const;
      }),
    );
    const prefsMap = new Map<string, { trashRetentionDays: number; autoDeleteBehavior: string }>(
      prefsEntries,
    );

    let totalVersionsPurged = 0;
    let totalNotesDeleted = 0;

    for (const note of trashedNotes) {
      const prefs = prefsMap.get(note.userId) ?? {
        trashRetentionDays: DEFAULT_RETENTION_DAYS,
        autoDeleteBehavior: 'delete_versions_only',
      };

      const retentionMs = prefs.trashRetentionDays * 24 * 60 * 60 * 1000;
      const cutoff = new Date(Date.now() - retentionMs);

      if (!note.deletedAt || note.deletedAt > cutoff) continue;

      if (prefs.autoDeleteBehavior === 'delete_note_and_versions') {
        // Hard-delete note + storage cleanup
        await this.notesService.cleanupNoteStorage(note);
        await this.prisma.note.delete({ where: { id: note.id } });
        totalNotesDeleted++;

        this.eventEmitter.emit(NOTIFICATION_SEND, {
          userId: note.userId,
          title: 'Note Permanently Deleted',
          message: `Note '${note.title}' has been permanently deleted after ${prefs.trashRetentionDays} days in trash`,
          type: 'version_cleanup',
          noteId: note.id,
        } satisfies NotificationPayload);
      } else {
        // delete_versions_only — delete versions, keep the note
        const { count } = await this.prisma.noteVersion.deleteMany({
          where: { noteId: note.id },
        });

        if (count === 0) continue;

        totalVersionsPurged += count;

        this.eventEmitter.emit(NOTIFICATION_SEND, {
          userId: note.userId,
          title: 'Version History Deleted',
          message: `The version history of Note '${note.title}' has been permanently deleted`,
          type: 'version_cleanup',
          noteId: note.id,
        } satisfies NotificationPayload);
      }
    }

    this.logger.log(
      `Purged ${totalVersionsPurged} versions, permanently deleted ${totalNotesDeleted} notes.`,
    );
  }

  async purgeExpiredTokens() {
    const now = new Date();

    const { count: refreshCount } = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }],
      },
    });

    const { count: resetCount } =
      await this.prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: now } },
      });

    this.logger.log(
      `Purged ${refreshCount} refresh tokens and ${resetCount} password reset tokens.`,
    );
  }

  async purgeExpiredInvites() {
    const { count } = await this.prisma.noteInvite.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        acceptedAt: null,
      },
    });

    this.logger.log(`Purged ${count} expired note invites.`);
  }

  async purgeExpiredMutes() {
    const { count } = await this.prisma.notificationMute.deleteMany({
      where: {
        expiresAt: { not: null, lt: new Date() },
      },
    });

    this.logger.log(`Purged ${count} expired notification mutes.`);
  }
}
