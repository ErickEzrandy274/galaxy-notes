# Feature: Shares API (Backend)

## Overview

The Shares API manages note sharing between users. It supports sharing with registered users (instant access), inviting unregistered users via email (token-based invites), permission management (READ/WRITE), and notifications for share lifecycle events (share, permission change, leave, revoke).

## API Endpoints

All endpoints are JWT-protected (`@UseGuards(AuthGuard('jwt'))`), under the `/api/shares` prefix.

### POST /api/shares

Share a note with one or more recipients. Owner-only.

**Body:** `BulkAddSharesDto`

```json
{
  "noteId": "cuid",
  "recipients": [
    { "email": "user@example.com", "permission": "READ" },
    { "email": "other@example.com", "permission": "WRITE" }
  ]
}
```

**Behavior:**
- Rejects draft notes (`400: Publish the note before sharing`)
- Skips sharing with self (owner's email)
- If recipient is a registered user: creates `NoteShare` record, sends `share` notification, updates note status from `published` to `shared`
- If recipient already has a share: updates permission if different
- If recipient is not registered: creates `NoteInvite` with 7-day expiry token, sends invite email

**Response:** `{ shared: NoteShareItem[], invited: NoteInvite[] }`

### GET /api/shares/note/:noteId

Get all shares and pending invites for a note. Owner-only.

**Response:** `{ shares: NoteShareItem[], pendingInvites: NoteInvite[] }`

### PATCH /api/shares/:shareId

Update a share's permission. Owner-only.

**Body:** `UpdateSharePermissionDto` — `{ permission: 'READ' | 'WRITE' }`

Sends a `permission_change` notification to the affected user if the permission actually changed.

### DELETE /api/shares/:shareId

Remove a share. Allowed by the **note owner** (revoke access) or the **share recipient** (leave).

**Authorization:** Owner OR recipient (`share.userId === userId`). Returns `403` for anyone else.

**Notifications:**
- When **owner** removes a share → sends `revoke` notification to the removed user: `"Access Revoked"` / `"{OwnerName} revoked your access to the note '{title}'"`
- When **recipient** leaves → sends `leave` notification to the owner: `"Collaborator Left"` / `"{UserName} left the note '{title}'"`

**Status cleanup:** If no shares remain and the note status is `shared`, reverts status to `published`.

### POST /api/shares/request-access/:noteId

Request access to a note (e.g., after it was unarchived). Sends an `access_request` notification to the note owner.

**Validations:**
- Note must exist and not be deleted (`404`)
- Cannot request access to own note (`400`)
- Cannot request if already has access (`400`)
- Duplicate requests within 1 hour are blocked (`400`)

**Response:** `{ message: "Access request sent" }`

### POST /api/shares/grant-access/:noteId/:userId

Grant access to a user who requested it. Owner-only. Accepts `?permission=READ|WRITE` query param (defaults to `READ`).

**Behavior:**
- Creates a `NoteShare` with the specified permission
- Updates note status to `shared` if currently `published`
- Sends `share` notification to the requester
- Updates the owner's original `access_request` notification type to `access_granted` (removes Grant/Decline actions)

**Validations:**
- Note must exist and belong to the owner (`404`)
- Note must not be archived (`400`)
- User must not already have access (`400`)

**Response:** `{ message: "Access granted" }`

### POST /api/shares/decline-access/:noteId/:userId

Decline an access request. Owner-only.

**Behavior:**
- Sends `access_declined` notification to the requester
- Updates the owner's original `access_request` notification type to `access_declined_by_owner` (removes Grant/Decline actions)

**Validations:**
- Note must exist and belong to the owner (`404`)

**Response:** `{ message: "Access request declined" }`

### DELETE /api/shares/invite/:inviteId

Remove a pending invite. Owner-only.

## Notification Types

| Type | Trigger | Recipient | Debounced | Rate-limited |
|------|---------|-----------|-----------|--------------|
| `share` | Note shared with user | Share recipient | Yes (15 min) | Yes (4/hr) |
| `permission_change` | Permission updated | Share recipient | Yes (15 min) | Yes (4/hr) |
| `leave` | Recipient leaves share | Note owner | No | No |
| `revoke` | Owner removes share | Removed user | No | No |
| `access_request` | Previous collaborator requests access | Note owner | No | Yes (1/hr per user per note) |
| `access_granted` | Owner grants access (mutated from `access_request`) | Note owner (self) | — | — |
| `access_declined_by_owner` | Owner declines access (mutated from `access_request`) | Note owner (self) | — | — |
| `access_declined` | Owner declines request | Requester | No | No |

**Debouncing:** Uses `lastNotifiedAt` field on the `NoteShare` record with a 15-minute window.

**Rate limiting:** Max 4 notifications per hour per note per collaborator for `share` and `permission_change` types.

## Email Invites

When a recipient email is not found in the database, a `NoteInvite` is created:
- 7-day expiry (`INVITE_EXPIRY_MS`)
- 32-byte random token
- Email sent via `MailService.sendShareInviteEmail()` with sharer name, note title, and invite token
- Duplicate invites (same email + noteId, not yet accepted) are skipped

## Code Location

| File | Purpose |
|------|---------|
| `server/src/shares/shares.controller.ts` | Route definitions |
| `server/src/shares/shares.service.ts` | Business logic, authorization, notifications |
| `server/src/shares/shares.module.ts` | Module registration |
| `server/src/shares/dto/bulk-add-shares.dto.ts` | Add shares validation |
| `server/src/shares/dto/update-share-permission.dto.ts` | Update permission validation |

## Database Models

```prisma
model NoteShare {
  id             String    @id @default(cuid())
  noteId         String
  userId         String
  permission     Permission @default(READ)
  lastNotifiedAt DateTime?
  createdAt      DateTime
  note           Note      @relation(...)
  user           User      @relation(...)
  @@unique([noteId, userId])
}

model NoteInvite {
  id         String    @id @default(cuid())
  token      String    @unique
  email      String
  noteId     String
  permission Permission @default(READ)
  invitedBy  String
  acceptedAt DateTime?
  expiresAt  DateTime
  createdAt  DateTime
  note       Note      @relation(...)
}

enum Permission {
  READ
  WRITE
}
```
