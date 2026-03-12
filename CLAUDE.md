# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Galaxy Notes is a full-stack note management application with multi-provider authentication, version history, and real-time collaboration features.

**Monorepo with 3 workspaces** — no turbo/nx orchestrator, each runs independently:

| Workspace | Stack | Port | Purpose |
|-----------|-------|------|---------|
| `client/` | Next.js 16, React 19, TanStack Query, Tailwind CSS 4 | 3000 | Frontend SPA with App Router |
| `server/` | NestJS 11, Passport JWT, Nodemailer, class-validator | 8080 | REST API backend |
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

**Models**: User, Account, Session, VerificationToken, PasswordResetToken, Note, NoteShare, NoteVersion, Notification.

### Client (`client/`)

Next.js 16 App Router with feature-based architecture:

```
client/src/
├── app/                # Next.js routes (thin wrappers importing feature components)
│   ├── (auth)/         # Login, Register
│   ├── (dashboard)/    # Notes, Profile (authenticated)
│   └── (password-reset)/ # Forgot, Reset Link Sent, Reset Password
├── features/           # Feature modules (api/, components/, hooks/, types/, utils/)
│   ├── auth/           # Login, register, OAuth buttons, password input, token refresh
│   ├── notes/          # Notes table, filters, search, pagination, autosave
│   └── profile/        # Profile settings (planned)
├── components/         # Shared UI components
├── lib/                # axios (with JWT interceptor), auth (NextAuth config), prisma, query-client
├── schemas/            # Zod validation schemas
└── types/              # TypeScript types (next-auth augmentation)
```

**Key patterns**:
- Features barrel-exported via `index.ts`
- Data fetching via TanStack React Query v5 (`useQuery`/`useMutation`)
- Forms via React Hook Form + Zod resolver
- Path alias: `@/*` maps to `./src/*`

### Server (`server/`)

NestJS 11 with module-based architecture:

```
server/src/
├── auth/               # Login, register, OAuth login, token refresh, password reset
├── users/              # Profile CRUD, photo upload, password change
├── notes/              # Notes CRUD, versioning, file uploads, sharing
├── mail/               # Nodemailer service + HTML email templates
│   └── templates/      # Email template functions (password-reset)
├── prisma/             # Global PrismaService module
├── health/             # Health check endpoint
└── common/             # Middleware (RequestId, CSRF), interceptors (Logging)
```

**Key patterns**:
- Each module: controller → service → DTOs
- Global middleware: `RequestIdMiddleware` (UUID per request), `CsrfMiddleware` (origin validation), `LoggingInterceptor` (request/response logging)
- Validation: `ValidationPipe` with whitelist & transform enabled
- API prefix: `/api/` (set in `main.ts`)

### Auth Flow (NextAuth + JWT Hybrid)

1. **OAuth** (Google/GitHub/Facebook): NextAuth handles browser auth → `linkAccount` callback sets `userType` → JWT callback calls `POST /api/auth/oauth-login` with `X-Internal-Secret` header → backend issues JWT
2. **Credentials**: `POST /api/auth/login` → bcrypt compare → JWT issued
3. **Token lifecycle**: 1-hour JWT, proactive refresh when within 10 min of expiry via axios interceptor + periodic background check (`useTokenRefresh` hook with 10-min interval), 401 retry with refreshed token
4. **Password reset**: 32-byte random token, 15-min expiry, sent via Nodemailer (Gmail SMTP)

### File Uploads (Signed URL Pattern)

Client requests signed URL from backend → backend generates Supabase Storage signed URL (service role key) → client PUTs file directly to Supabase → saves public URL. Max 1MB, types: webp/jpeg/png.

### Note Versioning & Autosave

Optimistic locking via `version` field (409 on mismatch). Non-draft notes create snapshots on update (max 20). Client `useNoteAutosave`: 2s debounce + 30s interval + localStorage draft recovery.

## Feature Documentation

Detailed feature docs with component trees, API specs, user flows, and design specs:

### Client Features (`client/src/docs/features/`)

| File | Feature |
|------|---------|
| `auth.md` | Login & Register (credentials + OAuth flows, components, validation) |
| `forgot-password.md` | Forgot password page (email submission, API integration) |
| `reset-link-sent.md` | Reset link confirmation (countdown timer, resend mechanism) |
| `reset-password.md` | Password reset form (token handling, strength bar, validation) |
| `oauth-linking.md` | OAuth account linking (collision detection, password verification) |
| `axios-interceptor.md` | JWT token management (proactive refresh, 401 retry, caching) |
| `notes.md` | My Notes dashboard (table, filters, search, pagination, column visibility) |

### Server Features (`server/src/docs/features/`)

| File | Feature |
|------|---------|
| `auth.md` | Auth module (register, login, JWT strategy, password security) |
| `token-refresh.md` | Token refresh endpoint (JWT renewal, timing, security) |
| `notes.md` | Notes API (CRUD, filtering, pagination, soft delete, versioning) |

## Code Style

- **Server**: Single quotes, trailing commas, Prettier enforced via ESLint. Decorators + emit metadata for NestJS DI. `@typescript-eslint/no-explicit-any` is off.
- **Client**: Next.js core-web-vitals ESLint preset. Strict TypeScript.
- **Both**: Strict null checks enabled. Target ES2017+ (client) / ES2023 (server).

## Key Env Variables

**Server** (`.env.local`): `PORT`, `CLIENT_URL`, `JWT_SECRET`, `INTERNAL_API_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

**Client** (`.env.local`): `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`, `INTERNAL_API_SECRET`, OAuth provider credentials (Google/GitHub/Facebook `CLIENT_ID` + `CLIENT_SECRET`), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `DATABASE_URL`, `DIRECT_URL`.

**Database** (`.env`): `DATABASE_URL`, `DIRECT_URL`.

Template files: `.env.example` in each workspace. Actual values: `.env.local` (gitignored).
