# Feature: Notes API (Backend)

## Overview

The Notes API provides CRUD operations for note management with server-side filtering, pagination, and soft delete.

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
      "content": "...",
      "status": "published",
      "tags": ["work", "project"],
      "videoUrl": null,
      "version": 1,
      "isDeleted": false,
      "userId": "cuid",
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

### GET /api/notes/:id

Fetch a single note by ID. Returns full note with user info and shares. Checks owner or shared access.

### POST /api/notes

Create a new note. Defaults status to `draft`.

### PATCH /api/notes/:id

Update a note. Requires `version` field for optimistic locking (409 Conflict if version mismatch).

### DELETE /api/notes/:id

Soft delete: sets `isDeleted: true`, `deletedAt: now()`, removes all shares.

### POST /api/notes/:id/restore

Restore from trash: sets `isDeleted: false`, `deletedAt: null`, `status: 'draft'`.

## Code Location

| File | Purpose |
|------|---------|
| `server/src/notes/notes.controller.ts` | Route definitions with query params |
| `server/src/notes/notes.service.ts` | Business logic, Prisma queries, access control |
| `server/src/notes/notes.module.ts` | Module registration |

## Database Model

```prisma
model Note {
  id        String     @id @default(cuid())
  title     String     @db.VarChar(255)
  content   String?    @db.Text
  status    NoteStatus @default(draft)
  tags      String[]   @default([])
  version   Int        @default(1)
  isDeleted Boolean    @default(false)
  deletedAt DateTime?
  userId    String
  createdAt DateTime
  updatedAt DateTime
  shares    NoteShare[]
}
```
