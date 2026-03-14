# Feature: Notifications API (Backend)

## Overview

The Notifications API provides real-time notifications via SSE (Server-Sent Events), CRUD operations for notification management, user muting, and supports multiple notification types across the sharing and note lifecycle.

## API Endpoints

All endpoints except the SSE stream are JWT-protected (`@UseGuards(AuthGuard('jwt'))`), under the `/api/notifications` prefix.

### GET /api/notifications/stream (SSE)

Opens a Server-Sent Events connection for real-time notification delivery.

**Auth:** JWT passed via `?token=` query param (EventSource doesn't support custom headers).

**Behavior:**
- Verifies JWT, extracts `userId` from `sub` claim
- Returns an `Observable<MessageEvent>` stream
- Emits new notifications as JSON-encoded `MessageEvent` data
- Cleans up on client disconnect via `req.on('close')`

### GET /api/notifications

Fetch paginated notifications for the authenticated user.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `filter` | string | — | Filter: `all`, `unread`, `shared`, `muted` |

**Response:** `{ notifications: NotificationItem[], total, page, limit }`

### GET /api/notifications/unread-count

Returns the count of unread notifications for the authenticated user.

### PATCH /api/notifications/:id/read

Mark a single notification as read.

### PATCH /api/notifications/read-all

Mark all notifications as read for the authenticated user.

### DELETE /api/notifications/:id

Delete a single notification.

### GET /api/notifications/muted-users

Get the list of muted users for the authenticated user.

### POST /api/notifications/mute/:userId

Mute notifications from a specific user.

**Body:** `MuteUserDto` — `{ duration: '1h' | '1d' | '1w' | 'forever' }`

### DELETE /api/notifications/mute/:userId

Unmute a previously muted user.

## Notification Types

| Type | Source | Title | Message | Icon |
|------|--------|-------|---------|------|
| `share` | `SharesService` | Note Shared With You | {name} shared the note '{title}' with you | Link2 (purple) |
| `permission_change` | `SharesService` | Permission Updated | {name} updated your permission to '{perm}' for note '{title}' | ShieldCheck (blue) |
| `leave` | `SharesService` | Collaborator Left | {name} left the note '{title}' | LogOut (red) |
| `revoke` | `SharesService` | Access Revoked | {name} revoked your access to the note '{title}' | ShieldOff (red) |
| `access_request` | `SharesService` | Access Requested | {name} requested access to your note '{title}' | UserPlus (indigo) |
| `access_granted` | `SharesService` | (mutated from `access_request`) | — | UserCheck (green) |
| `access_declined_by_owner` | `SharesService` | (mutated from `access_request`) | — | UserX (muted) |
| `access_declined` | `SharesService` | Access Request Declined | {name} declined your access request for note '{title}' | UserPlus (red) |
| `archive` | `NotesService` | Shared Note Archived | A note '{title}' shared with you has been archived by the owner | Archive (muted) |
| `trash` | `NotesService` | Shared Note Deleted | A note '{title}' shared with you has been deleted by the owner | Trash2 (muted) |
| `restore` | `NotesService` | Note Unarchived / Note Available Again | Note restored or available again for previous collaborators | RotateCcw (green) |
| `version_cleanup` | `NotesService` / `CleanupService` | Version History Scheduled for Deletion / Version History Deleted | Version history warning or purge confirmation | Trash2 (muted) |
| `edit` | — | — | — | Pencil (yellow) |

### `restore` Notification Variants

| Variant | Title | Recipient | Message | Clickable |
|---------|-------|-----------|---------|-----------|
| Owner unarchive | Note Unarchived | Note owner | Note '{title}' has been restored as {status} | Yes → `/notes/:noteId` |
| Previous collaborator | Note Available Again | Previous collaborators | {owner} unarchived the note '{title}'. The note is now available as read-only. You may request access again. | No (use "Request Access" in three-dot menu) |

## Notification Model

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  actorId   String?
  title     String
  message   String
  isRead    Boolean  @default(false)
  type      String
  noteId    String?
  createdAt DateTime
  user      User     @relation(...)
  actor     User?    @relation(...)
}
```

## Code Location

| File | Purpose |
|------|---------|
| `server/src/notifications/notifications.controller.ts` | Route definitions, SSE stream |
| `server/src/notifications/notifications.service.ts` | CRUD, muting, SSE stream management |
| `server/src/notifications/notifications.module.ts` | Module registration (exports service) |
| `server/src/notifications/dto/mute-user.dto.ts` | Mute duration validation |
