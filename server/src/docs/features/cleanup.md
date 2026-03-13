# Feature: Scheduled Cleanup (Backend)

## Overview

The cleanup module runs a weekly cron job that purges stale data: version history of long-trashed notes and expired authentication tokens.

## Schedule

**Cron expression:** `0 3 * * 0` — every Sunday at 3:00 AM server time.

Powered by `@nestjs/schedule` (`ScheduleModule.forRoot()` registered in `AppModule`).

## Cleanup Tasks

### 1. Purge Stale Note Versions

Deletes all `NoteVersion` records for notes where:
- `isDeleted = true` (note is in trash)
- `deletedAt` is older than 30 days

**Grace period:** 30 days. During this window the user can restore the note from trash and retain full version history. After 30 days, versions are permanently purged but the note record itself remains.

**Per-note notification:** After purging, creates a `Notification` for the note owner:
- **title:** `"Version History Deleted"`
- **message:** `"The version history of Note '{title}' has been permanently deleted"`
- **type:** `"version_cleanup"`
- **noteId:** the affected note's ID

### 2. Purge Expired Tokens

**RefreshToken:** Deletes rows where `expiresAt < now` OR `revokedAt IS NOT NULL`.

**PasswordResetToken:** Deletes rows where `expiresAt < now`.

## Notifications

Two notification touchpoints with type `version_cleanup`:

| Trigger | Title | Message |
|---------|-------|---------|
| Note soft-deleted (trash) | Version History Scheduled for Deletion | The version history of Note '{title}' will be permanently deleted after 30 days |
| Cron purges versions | Version History Deleted | The version history of Note '{title}' has been permanently deleted |

The trash notification is created in `NotesService.softDelete()`, not in `CleanupService`.

## Module Structure

```
server/src/cleanup/
├── cleanup.module.ts    # Imports NotificationsModule, provides CleanupService
└── cleanup.service.ts   # Cron job: purgeStaleNoteVersions(), purgeExpiredTokens()

server/src/notifications/
├── notifications.module.ts    # Exports NotificationsService
└── notifications.service.ts   # Wraps prisma.notification.create()
```

## Code Location

| File | Purpose |
|------|---------|
| `server/src/cleanup/cleanup.service.ts` | Cron handler, version purge logic, token purge logic |
| `server/src/cleanup/cleanup.module.ts` | Module registration |
| `server/src/notifications/notifications.service.ts` | Notification creation wrapper |
| `server/src/notifications/notifications.module.ts` | Module registration |
| `server/src/notes/notes.service.ts` | Trash notification in `softDelete()` |
| `server/src/app.module.ts` | Registers `ScheduleModule`, `CleanupModule`, `NotificationsModule` |

## Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/schedule` | Cron decorator and schedule module |
