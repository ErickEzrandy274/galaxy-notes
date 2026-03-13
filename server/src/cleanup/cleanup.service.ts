import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  private static readonly VERSION_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 3 * * 0') // Sunday 3:00 AM
  async handleCleanup() {
    this.logger.log('Starting scheduled cleanup...');
    await this.purgeStaleNoteVersions();
    await this.purgeExpiredTokens();
    this.logger.log('Scheduled cleanup complete.');
  }

  async purgeStaleNoteVersions() {
    const cutoff = new Date(
      Date.now() - CleanupService.VERSION_GRACE_PERIOD_MS,
    );

    const staleNotes = await this.prisma.note.findMany({
      where: {
        isDeleted: true,
        deletedAt: { lt: cutoff },
        versions: { some: {} },
      },
      select: {
        id: true,
        title: true,
        userId: true,
        _count: { select: { versions: true } },
      },
    });

    if (staleNotes.length === 0) {
      this.logger.log('No stale note versions to purge.');
      return;
    }

    let totalPurged = 0;

    for (const note of staleNotes) {
      const { count } = await this.prisma.noteVersion.deleteMany({
        where: { noteId: note.id },
      });
      totalPurged += count;

      await this.notificationsService.create({
        userId: note.userId,
        title: 'Version History Deleted',
        message: `The version history of Note '${note.title}' has been permanently deleted`,
        type: 'version_cleanup',
        noteId: note.id,
      });
    }

    this.logger.log(
      `Purged ${totalPurged} versions from ${staleNotes.length} trashed notes.`,
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
}
