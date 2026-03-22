# Backend Technical Details

## Server Bootstrap (`main.ts`)

```typescript
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('api');
app.use(cookieParser());
app.enableCors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['X-Request-ID'],
});
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.useGlobalInterceptors(new LoggingInterceptor());
await app.listen(process.env.PORT ?? 8080);
```

## Request Pipeline

Every HTTP request passes through these layers in order:

```
Incoming Request
  │
  ├─ cookie-parser             Parses cookies (refresh_token)
  │
  ├─ CORS                      Origin: CLIENT_URL, credentials: true
  │                            Exposed headers: X-Request-ID
  │
  ├─ RequestIdMiddleware        Assigns UUID to req.requestId
  │                            Sets X-Request-ID response header
  │                            Accepts incoming X-Request-ID if present
  │
  ├─ CsrfMiddleware            Origin validation for non-safe methods
  │                            Allows no-origin (server-to-server)
  │                            Blocks mismatched browser origins
  │
  ├─ ValidationPipe             class-validator with whitelist + transform
  │                            Strips unknown properties from DTOs
  │
  ├─ Route Guards               AuthGuard('jwt') — JWT in Authorization header
  │                            RefreshTokenGuard — refresh_token cookie/header
  │
  ├─ Controller + Service       Business logic
  │
  └─ LoggingInterceptor         Logs: [requestId] METHOD /url userId → status (durationMs)
```

## Middleware

### RequestIdMiddleware (`common/middleware/request-id.middleware.ts`)

Assigns a UUID to every request. Accepts an incoming `X-Request-ID` header if present (for distributed tracing), otherwise generates a new one via `crypto.randomUUID()`. Sets the ID on both `req.requestId` and the `X-Request-ID` response header.

### CsrfMiddleware (`common/middleware/csrf.middleware.ts`)

Origin-based CSRF protection for non-safe HTTP methods (POST, PATCH, PUT, DELETE):

- Extracts `Origin` header, falls back to extracting origin from `Referer`
- Validates against allowed origins from `CLIENT_URL` env var (comma-separated)
- **No origin/referer** → allowed (server-to-server calls like NextAuth JWT callback are not browser-initiated, so CSRF doesn't apply)
- **Mismatched origin** → 403 Forbidden with `requestId`

### LoggingInterceptor (`common/interceptors/logging.interceptor.ts`)

NestJS interceptor that logs every request/response:

- Format: `[requestId] METHOD /url userId=<id|anonymous> → statusCode (durationMs)`
- Uses `Logger.log()` for success, `Logger.warn()` for errors
- Duration measured from interceptor entry to response completion

## Module Architecture

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    ScheduleModule.forRoot(),  // @nestjs/schedule for cron jobs
    PrismaModule,              // Global — available to all modules without importing
    AuthModule,                // Login, register, OAuth, refresh, password reset
    UsersModule,               // Profile CRUD, avatar upload, password change
    NotesModule,               // Notes CRUD, versioning, file uploads, trash
    SharesModule,              // Note sharing, invites, permission management
    NotificationsModule,       // Notification CRUD, SSE stream, user muting
    PreferencesModule,         // User preferences (trash retention days)
    CleanupModule,             // Scheduled cleanup cron (stale versions, expired tokens)
    HealthModule,              // GET /api/health
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, CsrfMiddleware).forRoutes('*');
  }
}
```

### PrismaModule (`prisma/prisma.module.ts`)

Globally available module that provides `PrismaService`. The service extends `PrismaClient` and implements `OnModuleInit` (connects on startup) and `OnModuleDestroy` (disconnects on shutdown).

### Module Pattern

Each module follows the controller-service-DTO pattern:

```
Module
├── Controller     # Route handlers, parameter extraction, guards
├── Service        # Business logic, database operations
├── DTOs           # Request validation via class-validator decorators
├── Guards         # Authorization checks (JWT, refresh token)
└── Strategies     # Passport strategies (JWT extraction + validation)
```

## API Endpoints

### Auth (`/api/auth/`)

| Method | Path | Guard | Purpose |
|--------|------|-------|---------|
| POST | `/register` | None | Create account, return JWT + set refresh cookie |
| POST | `/login` | None | Credentials login, return JWT + set refresh cookie |
| POST | `/oauth-login` | X-Internal-Secret header | Server-to-server OAuth token exchange |
| POST | `/refresh` | RefreshTokenGuard | Rotate refresh token, issue new JWT |
| POST | `/logout` | AuthGuard('jwt') | Revoke all user's refresh tokens, clear cookie |
| POST | `/forgot-password` | None | Generate reset token, send email via Nodemailer |
| POST | `/reset-password` | None | Validate reset token, update password |

### Notes (`/api/notes/`)

All routes require `AuthGuard('jwt')`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/stats` | Note counts by status |
| GET | `/` | List notes (paginated, filtered, searchable) |
| GET | `/:id` | Get single note with resolved file URLs |
| POST | `/` | Create note |
| PATCH | `/:id` | Update note (optimistic locking via version field) |
| DELETE | `/:id` | Soft delete (sets isDeleted + deletedAt, notifies collaborators) |
| POST | `/:id/restore` | Restore from trash (resets to draft, creates restore notification) |
| GET | `/trash/:id` | Get trashed note detail (owner only) |
| POST | `/:id/upload-url` | Generate Supabase signed upload URL |
| GET | `/:id/versions` | List version history |
| GET | `/:id/versions/:versionId` | Get version detail with diff data |
| POST | `/:id/versions/:versionId/restore` | Restore note to a previous version |

### Shares (`/api/shares/`)

All routes require `AuthGuard('jwt')`.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | Share note with recipients (owner only, rejects drafts) |
| GET | `/note/:noteId` | Get shares + pending invites for a note (owner only) |
| PATCH | `/:shareId` | Update share permission (owner only) |
| DELETE | `/:shareId` | Remove share (owner revokes, or recipient leaves) |
| DELETE | `/invite/:inviteId` | Remove pending invite (owner only) |

### Notifications (`/api/notifications/`)

SSE stream uses query param auth; all other routes require `AuthGuard('jwt')`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/stream` | SSE stream (JWT via `?token=` query param) |
| GET | `/` | List notifications (paginated, filterable) |
| GET | `/unread-count` | Count unread notifications |
| PATCH | `/:id/read` | Mark single notification as read |
| PATCH | `/read-all` | Mark all notifications as read |
| DELETE | `/:id` | Delete a notification |
| GET | `/muted-users` | List muted users |
| POST | `/mute/:userId` | Mute user (with duration: 1h, 1d, 1w, forever) |
| DELETE | `/mute/:userId` | Unmute user |

### Users (`/api/users/`)

All routes require `AuthGuard('jwt')`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update profile (firstName, lastName, bio) |
| DELETE | `/me/avatar` | Remove avatar |
| POST | `/me/avatar/upload-url` | Generate signed URL for avatar upload |
| PATCH | `/me/avatar` | Save avatar storage path |
| PATCH | `/me/password` | Change password (verify current, hash new) |

## JWT Strategy (`auth/strategies/jwt.strategy.ts`)

- **Extraction**: Bearer token from `Authorization` header
- **Secret**: `JWT_SECRET` from env
- **Expiration**: 1 hour
- **Payload**: `{ sub: userId, email: userEmail }`
- **Validated output**: `{ id: payload.sub, email: payload.email }` — attached to `request.user`

## RefreshTokenGuard (`auth/guards/refresh-token.guard.ts`)

Used on `POST /api/auth/refresh` instead of `AuthGuard('jwt')`:

1. Extracts refresh token from `req.cookies['refresh_token']` or `x-refresh-token` header
2. Looks up token in database (`prisma.refreshToken.findUnique`)
3. Validates token is not revoked (`revokedAt` is null)
4. Checks token has not expired (`expiresAt > now`)
5. **Stolen token detection**: If a revoked token is reused, revoke ALL tokens for that user
6. Attaches `{ token, userId, email }` to `req.refreshTokenData`

The `x-refresh-token` header fallback exists for server-to-server calls (NextAuth JWT callback) where browser cookies are not available.

### Token Rotation Sequence

```
1. RefreshTokenGuard validates the incoming token
2. AuthService.refreshWithToken():
   a. Revoke current token (set revokedAt)
   b. Create new refresh token (replacedByToken = old token)
   c. Sign new JWT access token (1h expiry)
   d. Set new refresh token as httpOnly cookie
3. Return { accessToken, refreshToken } to client
```

### Refresh Token Cookie Settings

```typescript
res.cookie('refresh_token', token, {
  httpOnly: true,
  secure: isProduction,           // true in production
  sameSite: isProduction ? 'none' : 'lax',
  path: '/api/auth',             // only sent to auth endpoints
  maxAge: 24 * 60 * 60 * 1000,  // 24 hours
});
```

## Password Security

- **Algorithm**: bcrypt with 12 salt rounds
- **Nullable password**: OAuth-only users have no password (`User.password` is `String?`)
- **Password change**: Requires verifying current password before setting new one

## Password Reset

1. `POST /api/auth/forgot-password` — generates a 32-byte random token, stores in `PasswordResetToken` table with 15-minute expiry, sends email via Nodemailer (Gmail SMTP)
2. `POST /api/auth/reset-password` — validates token (existence + expiry + not already used), hashes new password with bcrypt (12 rounds), updates user's password, marks token as used

## Note Versioning (`notes.service.ts`)

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `MAX_VERSIONS` | 30 | Maximum snapshots per note (oldest deleted beyond limit) |
| `SNAPSHOT_THROTTLE_MS` | 10 minutes | Minimum interval between autosave-triggered snapshots |
| `SNAPSHOT_DEDUP_MS` | 30 seconds | Dedup window for manual saves (prevents autosave + manual save duplicates) |

### Snapshot Decision Tree

```
Note Update (PATCH /api/notes/:id)
  │
  ├─ Optimistic lock: request.version === db.version?
  │    └─ No → 409 Conflict
  │
  ├─ Status is draft or archived?
  │    └─ Yes → Skip versioning entirely
  │
  ├─ Is this a manual save (snapshot = true)?
  │    ├─ Yes → Check dedup (30s since last snapshot?)
  │    │         ├─ Within 30s → Skip
  │    │         └─ Beyond 30s → Create snapshot
  │    │
  │    └─ No (autosave) → Check throttle (10 min since last snapshot?)
  │                         ├─ Within 10 min → Skip
  │                         └─ Beyond 10 min → Create snapshot
  │
  ├─ Enforce MAX_VERSIONS = 30
  │
  └─ Increment version, apply changes
```

### Snapshot Contents

Each `NoteVersion` captures the note's state **before** the update:

- `title`, `content` — text content
- `document`, `documentSize` — PDF attachment metadata (storage path + file size in bytes)
- `videoUrl` — YouTube video URL
- `tags[]` — tag list
- `version` — version number at time of snapshot
- `changedBy` — user ID who made the change

### Version Detail Response (`getVersionById`)

Returns both the version data and current note data for diff comparison:

- Version fields: `title`, `content`, `document`, `documentSize`, `documentUrl`, `videoUrl`, `tags`
- Current note fields: `currentDocument`, `currentDocumentSize`, `currentDocumentUrl`, `currentVideoUrl`, `currentTags`

The `documentUrl` is resolved from the storage path via Supabase public URL. If the file no longer exists, `documentUrl` is null but `document` (path) is still returned so the frontend can show "File not available."

### Version Restore (`restoreVersion`)

1. Creates a snapshot of the current note state (preserves undo history)
2. Overwrites the note with the version's data: `title`, `content`, `document`, `documentSize`, `videoUrl`, `tags`

## File Uploads (Signed URL Pattern)

### Upload URL Generation

The backend generates signed upload URLs using Supabase Storage's service role key (60-second TTL). It validates:

- MIME type against allowed lists
- File size against limits

### Constants

| Constant | Value |
|----------|-------|
| `ALLOWED_MIME_TYPES_EDITOR` | `image/webp`, `image/jpeg`, `image/png` |
| `ALLOWED_MIME_TYPES_ATTACHMENT` | `application/pdf` |
| `MAX_FILE_SIZE_EDITOR` | 1 MB |
| `MAX_FILE_SIZE_ATTACHMENT` | 3 MB |

### Orphan Cleanup

When a note's `document` field changes during update, the backend deletes the old file from Supabase Storage to prevent orphaned files accumulating.

### URL Resolution (`resolveDocumentUrl`)

Converts a storage path (e.g., `notes/abc/file.pdf`) into a public Supabase Storage URL. Used when returning note details and version details to the client.

## Optimistic Locking

Note updates include a `version` field in the request body. The service checks:

```
if (request.version !== note.version) → 409 Conflict
```

On success, the version is incremented: `version: note.version + 1`.

This prevents concurrent edit conflicts — if two users edit the same note simultaneously, the second save will fail with 409 and must re-fetch.

## Soft Delete

Notes use soft delete: `isDeleted: true` and `deletedAt: new Date()`. All list queries filter by `isDeleted: false`.

On soft delete:
1. All `NoteShare` records for the note are deleted in a transaction
2. Each collaborator receives a `trash` notification: `"A note '{title}' shared with you has been deleted by the owner"`
3. The owner receives a `version_cleanup` notification warning that version history will be purged after the configured retention period

On restore: status is reset to `draft`, and the owner receives a `restore` notification.

## Note Sharing (`shares.service.ts`)

### Authorization

| Operation | Who can do it |
|-----------|---------------|
| Add shares | Note owner only |
| Get shares for note | Note owner only |
| Update permission | Note owner only |
| Remove share | Owner (revoke) OR recipient (leave) |
| Remove invite | Note owner only |

### Sharing Constraints

- Draft notes cannot be shared (`400: Publish the note before sharing`)
- Owners cannot share with themselves (silently skipped)
- When the first share is created, note status changes from `published` to `shared`
- When the last share is removed, note status reverts from `shared` to `published`

### Email Invites

For unregistered recipients, a `NoteInvite` is created:
- 32-byte random token
- 7-day expiry
- Email sent via `MailService.sendShareInviteEmail()`
- Duplicate invites (same email + noteId, not yet accepted) are skipped

### Notification Lifecycle

| Event | Type | Recipient | Debounced | Rate-limited |
|-------|------|-----------|-----------|--------------|
| Note shared | `share` | Share recipient | 15 min | 4/hr per note |
| Permission changed | `permission_change` | Share recipient | 15 min | 4/hr per note |
| Recipient leaves | `leave` | Note owner | No | No |
| Owner revokes share | `revoke` | Removed user | No | No |
| Note trashed | `trash` | All collaborators | No | No |

Debouncing uses `lastNotifiedAt` on the `NoteShare` record. Rate limiting counts recent notifications per type/note/user within a 1-hour window.

## Notifications (`notifications.service.ts`)

### SSE Stream

- `getStream(userId)` returns an `Observable<MessageEvent>` backed by a `Subject`
- New notifications are pushed via `Subject.next()` after database insert
- Client connects to `GET /api/notifications/stream?token=JWT` (EventSource)
- Connection cleanup on `req.close` event via `removeStream(userId)`

### User Muting

Users can mute notifications from specific actors:
- Duration options: `1h`, `1d`, `1w`, `forever` (null `expiresAt`)
- Muted notifications are filtered from the default notification list
- Expired mutes are ignored (treated as unmuted)

### Notification Types

| Type | Title | Source |
|------|-------|--------|
| `share` | Note Shared With You | `SharesService.addShares()` |
| `permission_change` | Permission Updated | `SharesService.updatePermission()` |
| `leave` | Collaborator Left | `SharesService.removeShare()` (recipient) |
| `revoke` | Access Revoked | `SharesService.removeShare()` (owner) |
| `trash` | Shared Note Deleted | `NotesService.softDelete()` |
| `restore` | Note Restored | `NotesService.restore()` |
| `version_cleanup` | Version History Scheduled/Deleted | `NotesService.softDelete()` / `CleanupService` |

## Scheduled Cleanup (`cleanup.service.ts`)

Cron expression: `0 3 * * 0` (every Sunday at 3:00 AM).

### Tasks

1. **Purge stale note versions**: Deletes all `NoteVersion` records for notes in trash (`isDeleted = true`) older than the configured retention period. Creates a `version_cleanup` notification per affected note.
2. **Purge expired tokens**: Deletes expired/revoked `RefreshToken` rows and expired `PasswordResetToken` rows.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default: 8080) |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated |
| `JWT_SECRET` | HS256 signing key for JWT access tokens |
| `INTERNAL_API_SECRET` | Shared secret for NextAuth → backend server-to-server calls |
| `DATABASE_URL` | PostgreSQL via PgBouncer |
| `DIRECT_URL` | PostgreSQL direct connection (migrations only) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, generates signed URLs) |
| `SMTP_HOST` | Email SMTP host (Gmail) |
| `SMTP_PORT` | Email SMTP port |
| `SMTP_USER` | Email SMTP username |
| `SMTP_PASS` | Email SMTP password / app password |
