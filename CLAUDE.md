# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Galaxy Notes is a full-stack note management application with multi-provider authentication, version history, and real-time collaboration features.

**Monorepo with 3 workspaces** — no turbo/nx orchestrator, each runs independently:

| Workspace | Stack | Port | Purpose |
|-----------|-------|------|---------|
| `client/` | Next.js 16, React 19, TanStack Query, Tailwind CSS 4 | 3000 | Frontend SPA with App Router |
| `server/` | NestJS 11, Passport JWT, Nodemailer, class-validator, @nestjs/schedule | 8080 | REST API backend |
| `database/` | Prisma ORM, PostgreSQL (Supabase) | — | Shared schema package (`@galaxy-notes/database`) |

## Commands

```bash
# Server (NestJS) — from server/
pnpm start:dev          # Dev with watch mode
pnpm build              # Compile to dist/
pnpm lint               # ESLint with auto-fix
pnpm test               # Unit tests (Jest)
pnpm test:watch         # Tests in watch mode
pnpm test:e2e           # End-to-end tests
pnpm format             # Prettier formatting

# Client (Next.js) — from client/
pnpm dev                # Dev server on :3000
pnpm build              # Production build
pnpm lint               # ESLint

# Database (Prisma) — from database/
pnpm db:generate        # Generate Prisma client
pnpm db:migrate:dev     # Create/apply migration (dev)
pnpm db:migrate:deploy  # Apply migrations (prod)
pnpm db:push            # Push schema without migration file
pnpm db:studio          # Open Prisma Studio GUI
```

## Architecture

### Database Layer (`database/`)

Single source of truth for the Prisma schema at `database/prisma/schema.prisma`. Both client and server import `@galaxy-notes/database`. The client uses a singleton pattern in `database/src/client.ts`. Server wraps it in a global `PrismaModule` with `PrismaService extends PrismaClient`.

Connection pooling via PgBouncer (`?pgbouncer=true` in `DATABASE_URL`). `DIRECT_URL` bypasses the pooler for migrations only.

**Important**: If migration drift exists, use `pnpm db:push` instead of `pnpm db:migrate:dev` to avoid database resets.

**Models**: User, Account, Session, VerificationToken, RefreshToken, PasswordResetToken, Note, NoteShare, NoteInvite, NoteVersion, Notification, NotificationMute.

### Client (`client/`)

Next.js 16 App Router with feature-based architecture:

```
client/src/
├── app/                # Next.js routes (thin wrappers importing feature components)
│   ├── (auth)/         # Login, Register
│   ├── (dashboard)/    # Notes, Shared, Archived, Notifications, Trash, Profile, Settings (authenticated)
│   └── (password-reset)/ # Forgot, Reset Link Sent, Reset Password
├── features/           # Feature modules (api/, components/, hooks/, types/, utils/)
│   ├── auth/           # Login, register, OAuth buttons, password input, token refresh
│   ├── notes/          # Notes table, filters, search, pagination, autosave, sharing, notifications, archived notes
│   ├── trash/          # Trash management (list, detail, restore, permanent delete)
│   └── profile/        # Profile settings, avatar upload, password change
├── components/         # Shared UI components
├── stores/             # Zustand stores (sidebar-store.ts, column-visibility-store.ts)
├── lib/                # axios (with JWT interceptor + AbortController support), auth (NextAuth config), prisma, query-client
├── schemas/            # Zod validation schemas
└── types/              # TypeScript types (next-auth augmentation)
```

**Key patterns**:
- Features barrel-exported via `index.ts`
- Data fetching via TanStack React Query v5 (`useQuery`/`useMutation`) with AbortController signal forwarding for automatic request cancellation
- State management via Zustand (`stores/`) with `persist` middleware for UI preferences (sidebar collapsed, column visibility)
- Forms via React Hook Form + Zod resolver
- Path alias: `@/*` maps to `./src/*`

### Server (`server/`)

NestJS 11 with module-based architecture:

```
server/src/
├── auth/               # Login, register, OAuth login, token refresh, password reset
├── users/              # Profile CRUD, photo upload, password change
├── notes/              # Notes CRUD, versioning, file uploads, trash
├── shares/             # Note sharing, invites, permission management, leave/revoke
├── notifications/      # Notification CRUD, SSE stream, user muting
├── preferences/        # User preferences (trash retention days)
├── cleanup/            # Scheduled cleanup cron job (stale versions, expired tokens)
├── mail/               # Nodemailer service + HTML email templates
│   └── templates/      # Email template functions (password-reset, share-invite)
├── prisma/             # Global PrismaService module
├── health/             # Health check endpoint
└── common/             # Middleware (RequestId, CSRF), interceptors (Logging), logger (AppLogger), context (AsyncLocalStorage)
```

**Key patterns**:
- Each module: controller → service → DTOs
- Global middleware: `RequestIdMiddleware` (UUID per request + AsyncLocalStorage context), `CsrfMiddleware` (origin validation), `LoggingInterceptor` (request/response logging via AppLogger)
- Custom logger: `AppLogger` extends `ConsoleLogger`, auto-prefixes all logs with `[requestId]` via `AsyncLocalStorage` — works across async boundaries without manual passing
- Notifications use `@nestjs/event-emitter` (fire-and-forget): services emit `notification.send` events, `NotificationListener` handles DB write + SSE push asynchronously
- Login rate limiting: `LoginThrottleGuard` with escalating cooldowns (15s → 30s → 60s → 2m) after every 5 failed attempts
- Swagger docs available at `/api/docs` (dev environment only, `NODE_ENV !== 'production'`)
- Validation: `ValidationPipe` with whitelist & transform enabled
- API prefix: `/api/` (set in `main.ts`)

### Auth Flow (NextAuth + JWT Hybrid)

1. **OAuth** (Google/GitHub/Facebook): NextAuth handles browser auth → `linkAccount` callback sets `userType` → JWT callback calls `POST /api/auth/oauth-login` with `X-Internal-Secret` header → backend issues JWT
2. **Credentials**: `POST /api/auth/login` → bcrypt compare → JWT issued
3. **Token lifecycle**: 1-hour JWT, httpOnly cookie refresh tokens with rotation and stolen token detection. Proactive refresh when within 10 min of expiry via axios interceptor + periodic background check (`useTokenRefresh` hook with 5-min interval), 401 retry with refreshed token
4. **Password reset**: 32-byte random token, 15-min expiry, sent via Nodemailer (Gmail SMTP)

### File Uploads (Signed URL Pattern)

Client requests signed URL from backend → backend generates Supabase Storage signed URL (service role key) → client PUTs file directly to Supabase → saves storage path. Two upload sources:

- **Rich-text editor images:** max 1MB, types: webp/jpeg/png
- **Note attachments (PDF):** max 3MB, type: application/pdf

### Note Sharing

Notes can be shared with other users (READ or WRITE permission). The share lifecycle generates notifications:
All notifications below are emitted as fire-and-forget events via `EventEmitter2` and processed asynchronously by `NotificationListener`. They never block the HTTP response.

- **Share:** Owner shares → recipient gets `share` notification (debounced 15 min, rate-limited 4/hr)
- **Permission change:** Owner updates permission → recipient gets `permission_change` notification
- **Leave:** Recipient leaves → owner gets `leave` notification
- **Revoke:** Owner removes share → removed user gets `revoke` notification
- **Trash:** Owner deletes note → all collaborators get `trash` notification
- **Archive:** Owner archives note → all collaborators get `archive` notification, shares are revoked, collaborator IDs stored in `previousCollaboratorIds`
- **Unarchive:** Owner unarchives note → previous collaborators get `restore` notification ("Note Available Again"), can request access via three-dot menu
- **Access request:** Previous collaborator requests access → owner gets `access_request` notification (1-hour duplicate cooldown)
- **Grant access:** Owner grants access (Can View or Can Edit) → requester gets `share` notification, owner's `access_request` notification becomes `access_granted`
- **Decline access:** Owner declines request → requester gets `access_declined` notification, owner's `access_request` notification becomes `access_declined_by_owner`

Unregistered recipients receive email invites (7-day expiry token). Draft notes cannot be shared. Archived notes cannot be shared. Real-time notifications via SSE stream with toast popups on the client.

### Note Archiving

Notes can be archived by the owner (published/shared only, not draft). Archived notes are read-only — cannot be edited, shared, deleted, or have versions restored. They are excluded from the main notes list and shown on a dedicated `/archived` page.

- **Archive:** Sets `status: 'archived'`, stores `previousStatus` and `previousCollaboratorIds`, deletes all shares, notifies collaborators
- **Unarchive:** Restores to `previousStatus` (or `published` if it was `shared`), clears `previousCollaboratorIds`, notifies owner and previous collaborators
- **Request access:** Previous collaborators can request access via notification three-dot menu → `POST /api/shares/request-access/:noteId` → owner gets `access_request` notification
- **Grant/Decline:** Owner uses three-dot menu on `access_request` notification → `POST /api/shares/grant-access/:noteId/:userId?permission=READ|WRITE` or `POST /api/shares/decline-access/:noteId/:userId` → original notification type updates to `access_granted` or `access_declined_by_owner`, options removed

### Note Versioning & Autosave

Optimistic locking via `version` field (409 on mismatch). Non-draft notes create snapshots on update (max 30, 10-min throttle for autosave, 30s dedup for manual save). Client `useNoteAutosave`: 2s debounce + 2-min interval + localStorage draft recovery.

### Scheduled Cleanup (Cron)

Weekly cron job (Sunday 3 AM) via `@nestjs/schedule` purges stale data:
- **Note versions**: Deletes all `NoteVersion` records for notes trashed (`isDeleted = true`) for 30+ days. Creates a notification per affected note.
- **Expired tokens**: Deletes expired or revoked `RefreshToken` rows and expired `PasswordResetToken` rows.

On soft-delete, collaborators are notified (type `trash`) and the owner receives a `version_cleanup` warning that version history will be purged after the configured retention period. On restore, the owner receives a `restore` notification.

Note: Archived notes cannot be deleted directly — they must be unarchived first.

## Feature Documentation

Detailed feature docs with component trees, API specs, user flows, and design specs are located in:

- **Client:** `client/src/docs/features/`
- **Server:** `server/src/docs/features/`

## Code Style

- **Server**: Single quotes, trailing commas, Prettier enforced via ESLint. Decorators + emit metadata for NestJS DI. `@typescript-eslint/no-explicit-any` is off.
- **Client**: Next.js core-web-vitals ESLint preset. Strict TypeScript.
- **Both**: Strict null checks enabled. Target ES2017+ (client) / ES2023 (server).

## Key Env Variables

**Server** (`.env.local`): `PORT`, `CLIENT_URL`, `JWT_SECRET`, `INTERNAL_API_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

**Client** (`.env.local`): `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`, `INTERNAL_API_SECRET`, OAuth provider credentials (Google/GitHub/Facebook `CLIENT_ID` + `CLIENT_SECRET`), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `DATABASE_URL`, `DIRECT_URL`.

**Database** (`.env`): `DATABASE_URL`, `DIRECT_URL`.

Template files: `.env.example` in each workspace. Actual values: `.env.local` (gitignored).
