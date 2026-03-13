# Feature: Notes API (Backend)

## Overview

The Notes API provides CRUD operations for note management with server-side filtering, pagination, soft delete, file uploads (signed URL pattern), and version history with diff tracking.

## API Endpoints

All endpoints are JWT-protected (`@UseGuards(AuthGuard('jwt'))`), under the `/api/notes` prefix.

### GET /api/notes

Fetch paginated notes for the authenticated user.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Notes per page |
| `status` | string | — | Filter by status: `draft`, `published`, `archived`, `shared` |
| `search` | string | — | Case-insensitive title search (substring match) |
| `tags` | string | — | Comma-separated tags, matches notes containing ANY of the tags |

**Response:**

```json
{
  "notes": [
    {
      "id": "cuid",
      "title": "Note title",
      "status": "published",
      "tags": ["work", "project"],
      "createdAt": "2026-01-15T00:00:00.000Z",
      "updatedAt": "2026-03-07T00:00:00.000Z",
      "_count": { "shares": 2 }
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10
}
```

**Prisma query filters:**
- `title: { contains: search, mode: 'insensitive' }` — case-insensitive substring search
- `tags: { hasSome: ['tag1', 'tag2'] }` — matches notes with ANY of the specified tags
- `status: 'draft'` — exact match on NoteStatus enum
- `_count: { select: { shares: true } }` — includes share count without fetching full share records

### GET /api/notes/stats

Returns note count grouped by status for the authenticated user.

### GET /api/notes/tags

Returns all tags used by the authenticated user with counts, sorted by frequency.

### GET /api/notes/:id

Fetch a single note by ID. Returns full note with resolved `documentUrl` (signed Supabase URL), user info, and shares. Checks owner or shared access.

**Response includes:**
- `document` — storage path of the attached PDF (renamed from `photo`)
- `documentUrl` — signed download URL (resolved from `document` path via Supabase)
- `documentSize` — file size in bytes
- `videoUrl` — YouTube URL
- `tags` — string array

### POST /api/notes

Create a new note. Defaults status to `draft`.

**Body:** `CreateNoteDto` — `title` (required), `content`, `status`, `tags`, `videoUrl`, `document`

### PATCH /api/notes/:id

Update a note. Requires `version` field for optimistic locking (409 Conflict if version mismatch).

**Body:** `UpdateNoteDto` — `title`, `content`, `status`, `tags`, `videoUrl`, `document`, `documentSize`, `version` (required), `snapshot`

**Document handling:**
- If `document` is a full URL, extracts the storage path
- If `document` changed or was cleared, deletes the old file from Supabase Storage

**Version snapshot logic (non-draft notes only):**
- `snapshot: true` (manual save): creates version snapshot unless one was created within the last 30 seconds (dedup window to prevent autosave + manual save race)
- `snapshot: false` (autosave): creates version snapshot only if the last one is older than 10 minutes (throttle window)

### POST /api/notes/upload-url

Generate a signed upload URL for file uploads.

**Body:** `CreateSignedUploadUrlDto` — `noteId`, `fileName`, `mimeType`, `fileSize`, `source` (`'rich-text-editor'` | `'attachment'`)

**Constraints:**
- Editor images: webp/jpeg/png, max 1MB
- Attachments: PDF only, max 3MB

### DELETE /api/notes/:id

Soft delete: sets `isDeleted: true`, `deletedAt: now()`, removes all shares. Creates a notification with type `version_cleanup` warning the user that version history will be permanently deleted after 30 days.

### POST /api/notes/:id/restore

Restore from trash: sets `isDeleted: false`, `deletedAt: null`, `status: 'draft'`.

## Version History

### GET /api/notes/:id/versions

Paginated version history with cursor-based pagination. Returns version summaries (id, version number, title, changedBy name, createdAt) with `nextCursor` and `hasMore`.

### GET /api/notes/:id/versions/:versionId

Fetch a specific version with full content and diff context:

| Field | Description |
|-------|-------------|
| `content` | Version's content with resolved image URLs |
| `document` | Version's attachment storage path |
| `documentSize` | Version's attachment file size |
| `documentUrl` | Signed URL for the version's attachment (null if file deleted) |
| `videoUrl` | Version's YouTube URL |
| `tags` | Version's tags array |
| `currentContent` | Current note's content (for diff comparison) |
| `currentTitle` | Current note's title |
| `currentDocument` | Current note's attachment path |
| `currentDocumentSize` | Current note's attachment size |
| `currentDocumentUrl` | Signed URL for current attachment |
| `currentVideoUrl` | Current note's YouTube URL |
| `currentTags` | Current note's tags |

### POST /api/notes/:id/versions/:versionId/restore

Restore a version: snapshots the current state first, then overwrites the note with the version's `title`, `content`, `document`, `documentSize`, `videoUrl`, and `tags`. Increments version counter.

Cannot restore on archived notes (400 error).

## Version Snapshot Behavior

- **Max versions:** 30 per note (oldest deleted when exceeded)
- **Snapshot throttle:** 10 minutes for autosave-triggered snapshots
- **Snapshot dedup:** 30 seconds for manual save (prevents duplicate from autosave + manual save race condition)
- **Tracked fields:** `title`, `content`, `document`, `documentSize`, `videoUrl`, `tags`

## Version Cleanup (Scheduled)

A weekly cron job (Sunday 3:00 AM) in `CleanupService` permanently deletes all `NoteVersion` records for notes that have been in trash (`isDeleted = true`) for more than 30 days.

**Grace period:** 30 days from `deletedAt`. During this window, the user can restore the note and retain full version history.

**Notifications:**
- **On trash:** `"The version history of Note '{title}' will be permanently deleted after 30 days"` (type: `version_cleanup`)
- **On purge:** `"The version history of Note '{title}' has been permanently deleted"` (type: `version_cleanup`)

## Code Location

| File | Purpose |
|------|---------|
| `server/src/notes/notes.controller.ts` | Route definitions, query params, DTOs |
| `server/src/notes/notes.service.ts` | Business logic, Prisma queries, access control, Supabase Storage |
| `server/src/notes/notes.module.ts` | Module registration (imports NotificationsModule) |
| `server/src/notes/dto/create-note.dto.ts` | Create note validation |
| `server/src/notes/dto/update-note.dto.ts` | Update note validation |
| `server/src/notes/dto/create-signed-upload-url.dto.ts` | Upload URL validation |
| `server/src/notes/dto/get-versions.dto.ts` | Version query validation |

## Database Models

```prisma
model Note {
  id           String     @id @default(cuid())
  title        String     @db.VarChar(255)
  content      String?    @db.Text
  status       NoteStatus @default(draft)
  document     String?    @map("photo")          // PDF attachment storage path
  documentSize Int?       @map("document_size")   // File size in bytes
  videoUrl     String?    @map("video_url")
  tags         String[]   @default([])
  version      Int        @default(1)
  isDeleted    Boolean    @default(false)
  deletedAt    DateTime?
  userId       String
  createdAt    DateTime
  updatedAt    DateTime
  shares       NoteShare[]
  versions     NoteVersion[]
}

model NoteVersion {
  id           String   @id @default(cuid())
  noteId       String
  version      Int
  title        String   @db.VarChar(255)
  content      String   @db.Text
  changedBy    String
  document     String?                           // Snapshot of attachment path
  documentSize Int?     @map("document_size")
  videoUrl     String?  @map("video_url")
  tags         String[] @default([])
  createdAt    DateTime
  note         Note     @relation(...)
}
```

**Note:** The `document` field on `Note` maps to the `photo` column in PostgreSQL (`@map("photo")`) for backward compatibility with the existing database column. The `NoteVersion.document` column has no mapping — it's a new column.
