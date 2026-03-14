# TECHNICALS.md

Architecture and workflow overview for Galaxy Notes.

For detailed technical docs, see:
- **Frontend:** [`client/TECHNICALS.md`](client/TECHNICALS.md)
- **Backend:** [`server/TECHNICALS.md`](server/TECHNICALS.md)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                          │
│  Next.js 16 App Router  ·  React 19  ·  TanStack Query v5         │
│  Port 3000                                                         │
│                                                                     │
│  ┌──────────────┐  ┌───────────┐  ┌──────────────┐                 │
│  │  NextAuth.js  │  │ Axios     │  │ React Query  │                 │
│  │  (JWT session │  │ Interceptor│  │ (cache +     │                 │
│  │   + OAuth)    │  │ (token    │  │  mutations)  │                 │
│  │              │  │  mgmt)    │  │              │                 │
│  └──────┬───────┘  └─────┬─────┘  └──────┬───────┘                 │
│         │                │               │                          │
└─────────┼────────────────┼───────────────┼──────────────────────────┘
          │                │               │
          │  HTTPS         │  REST /api/*  │
          │  (JWT cookie)  │  (Bearer JWT) │
          ▼                ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Server (API)                               │
│  NestJS 11  ·  Passport JWT  ·  class-validator                    │
│  Port 8080  ·  Global prefix: /api                                 │
│                                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│  │  Auth  │ │ Notes  │ │ Shares │ │Notific.│ │ Users  │ │ Health ││
│  │ Module │ │ Module │ │ Module │ │ Module │ │ Module │ │ Module ││
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └────────┘│
│      │          │          │          │          │                  │
│      │   ┌──────┴──────┐   │   ┌──────┴──────┐   │                  │
│      │   │  Cleanup    │   │   │ Preferences │   │                  │
│      │   │  Module     │   │   │ Module      │   │                  │
│      │   └──────┬──────┘   │   └──────┬──────┘   │                  │
│      └──────────┴──────────┴──────────┴──────────┘                  │
│                            │                                        │
│                     ┌──────┴──────┐                                  │
│                     │ PrismaModule │  (Global)                       │
│                     │ PrismaService│                                  │
│                     └──────┬──────┘                                  │
│                            │                                        │
│  ┌─────────────────────────┼────────────────────────────────────┐   │
│  │         SSE Stream      │    (Notifications → Browser)       │   │
│  │  /api/notifications/stream?token=JWT                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│   PostgreSQL     │   │ Supabase Storage │
│   (Supabase DB)  │   │ (file uploads)   │
│   via PgBouncer  │   │                  │
└──────────────────┘   └──────────────────┘
```

## Monorepo Structure

Three independent workspaces (no turbo/nx orchestrator):

| Workspace | Stack | Port | Package Name |
|-----------|-------|------|-------------|
| `client/` | Next.js 16, React 19, Tailwind CSS 4 | 3000 | — |
| `server/` | NestJS 11, Passport JWT, Nodemailer | 8080 | — |
| `database/` | Prisma ORM, PostgreSQL | — | `@galaxy-notes/database` |

### Database Workspace (`database/`)

Source of truth for the Prisma schema at `database/prisma/schema.prisma`.

- Exports Prisma client via a singleton pattern in `database/src/client.ts` (prevents multiple instances in dev due to hot-reload)
- Both `client/` and `server/` depend on this package (`@galaxy-notes/database`)
- The **server** also maintains its own Prisma schema copy at `server/prisma/schema.prisma` and generates its own `@prisma/client` — both must stay in sync
- Connection pooling via PgBouncer (`?pgbouncer=true` in `DATABASE_URL`); `DIRECT_URL` bypasses pooler for migrations only

## Data Model

```
┌──────────┐    ┌──────────┐    ┌───────────────┐
│   User   │───<│  Account │    │VerificationTkn│
│          │    │ (OAuth)  │    └───────────────┘
│ id       │    └──────────┘
│ email    │───<┌──────────┐    ┌───────────────┐
│ password?│    │ Session  │    │PasswordReset  │
│ firstName│    └──────────┘    │     Token     │
│ lastName │                    └───────────────┘
│ userType │───<┌──────────────┐
│ photo    │    │ RefreshToken │
│ bio      │    │              │
└────┬─────┘    │ token        │
     │          │ expiresAt    │
     │          │ revokedAt?   │
     │          │ replacedBy?  │
     │          └──────────────┘
     │
     ├───<┌──────────┐    ┌─────────────┐
     │    │   Note   │───<│ NoteVersion │
     │    │          │    │             │
     │    │ title    │    │ version     │
     │    │ content  │    │ title       │
     │    │ status   │    │ content     │
     │    │ document │    │ document    │
     │    │ docSize  │    │ documentSize│
     │    │ videoUrl │    │ videoUrl    │
     │    │ tags[]   │    │ tags[]      │
     │    │ version  │    │ changedBy   │
     │    │ isDeleted│    └─────────────┘
     │    └────┬─────┘
     │         │
     │         ├───<┌──────────────┐
     │         │    │  NoteShare   │
     │         │    │ permission   │
     │         │    │ (READ/WRITE) │
     │         │    │lastNotifiedAt│
     │         │    └──────────────┘
     │         │
     │         └───<┌──────────────┐
     │              │  NoteInvite  │
     │              │ token        │
     │              │ email        │
     │              │ permission   │
     │              │ invitedBy    │
     │              │ acceptedAt?  │
     │              │ expiresAt    │
     │              └──────────────┘
     │
     ├───<┌──────────────┐
     │    │ Notification │
     │    │ title        │
     │    │ message      │
     │    │ isRead       │
     │    │ type         │
     │    │ actorId?     │
     │    │ noteId?      │
     │    └──────────────┘
     │
     └───<┌──────────────────┐
          │NotificationMute  │
          │ mutedUserId      │
          │ expiresAt?       │
          └──────────────────┘
```

### Key Enums

- **UserType**: `general_user`, `google_user`, `github_user`, `facebook_user`
- **NoteStatus**: `draft`, `published`, `archived`, `shared`
- **Permission**: `READ`, `WRITE`

## Authentication Workflow

The application uses a **NextAuth + NestJS JWT hybrid** authentication system:

- **NextAuth** handles the browser-side session (JWT strategy stored in a cookie) and OAuth provider flows
- **NestJS backend** issues and validates its own JWT access tokens and httpOnly refresh tokens
- The two systems are bridged: NextAuth stores the backend's JWT in its own token, and the axios interceptor attaches it to API requests

### Credentials Login

```
Browser                    NextAuth (Server-Side)         NestJS Backend
  │                              │                              │
  │  signIn('credentials',       │                              │
  │    { email, password })      │                              │
  │─────────────────────────────>│                              │
  │                              │  POST /api/auth/login        │
  │                              │  { email, password }         │
  │                              │─────────────────────────────>│
  │                              │                              │ bcrypt.compare()
  │                              │                              │ sign JWT (1h)
  │                              │                              │ create RefreshToken in DB
  │                              │  { accessToken, id, email }  │
  │                              │  Set-Cookie: refresh_token   │
  │                              │<─────────────────────────────│
  │                              │                              │
  │                              │ jwt callback:                │
  │                              │  token.accessToken = data    │
  │                              │  token.refreshToken = cookie │
  │                              │  token.accessTokenExpires    │
  │                              │    = now + 55min             │
  │  NextAuth session cookie     │                              │
  │<─────────────────────────────│                              │
```

### OAuth Login (Google/GitHub/Facebook)

```
Browser                    NextAuth (Server-Side)         NestJS Backend
  │                              │                              │
  │  signIn('google')            │                              │
  │─────────────────────────────>│                              │
  │  ← redirect to Google →     │                              │
  │  ← callback with profile →  │                              │
  │                              │                              │
  │                              │ PrismaAdapter:               │
  │                              │  findOrCreate User + Account │
  │                              │                              │
  │                              │ linkAccount event:            │
  │                              │  set userType = google_user  │
  │                              │  (only if general_user)      │
  │                              │                              │
  │                              │ jwt callback:                │
  │                              │  POST /api/auth/oauth-login  │
  │                              │  Headers: X-Internal-Secret  │
  │                              │  { email, provider }         │
  │                              │─────────────────────────────>│
  │                              │                              │ find/create user
  │                              │                              │ sign JWT + refresh token
  │                              │  { accessToken, refreshToken}│
  │                              │<─────────────────────────────│
  │                              │                              │
  │                              │  Store tokens in JWT cookie  │
  │  NextAuth session cookie     │                              │
  │<─────────────────────────────│                              │
```

## Token Refresh Workflow

Token refresh happens at three layers:

1. **Axios request interceptor (proactive)**: Before each API call, if the cached token expires within 10 minutes, calls `POST /api/auth/refresh` via the httpOnly cookie
2. **Periodic background refresh (`useTokenRefresh` hook)**: Every 5 minutes + on tab visibility change + on window focus, triggers `getSession()` which invokes the NextAuth JWT callback server-side
3. **Axios response interceptor (reactive)**: On 401 response, attempts one refresh + retry; on failure, logs out and redirects to `/login`

Concurrent requests deduplicate refresh calls via a shared promise.

### Token Rotation

Each refresh performs a full rotation: the current refresh token is revoked, a new one is created (linked via `replacedByToken`), and a new JWT access token is signed.

### Stolen Token Detection

If a revoked refresh token is reused, all of that user's active refresh tokens are revoked (family invalidation), forcing re-authentication.

### Token Storage Layers

| Layer | Location | Purpose | Lifetime |
|-------|----------|---------|----------|
| NextAuth JWT cookie | Browser cookie (encrypted by NextAuth) | Persistent session, survives page refresh | 24 hours |
| In-memory cache (`cachedToken`) | JS variable in axios module | Fast synchronous access per request | Until page refresh |
| httpOnly refresh_token cookie | Browser cookie (path: /api/auth) | Refresh token delivery to backend | 24 hours |
| Database `RefreshToken` | PostgreSQL | Server-side validation and revocation | Until revoked/expired |

## File Upload Workflow (Signed URL Pattern)

Files are never uploaded through the NestJS server. Instead:

```
Client                         NestJS Server                    Supabase Storage
  │                                │                                │
  │  POST /api/notes/:id/upload-url│                                │
  │  { fileName, mimeType }       │                                │
  │───────────────────────────────>│                                │
  │                                │ Validate mime type + size      │
  │                                │ Generate signed upload URL     │
  │                                │  (service role key, 60s TTL)  │
  │  { signedUrl, path }          │                                │
  │<───────────────────────────────│                                │
  │                                                                 │
  │  PUT <signedUrl>                                                │
  │  Body: file binary                                              │
  │────────────────────────────────────────────────────────────────>│
  │                                                                 │
  │  PATCH /api/notes/:id                                           │
  │  { document: "storage/path" } │                                │
  │───────────────────────────────>│ Save path in DB               │
```

| Type | Max Size | Allowed MIME Types |
|------|----------|-------------------|
| Editor images (rich text) | 1 MB | image/webp, image/jpeg, image/png |
| Note attachments (PDF) | 3 MB | application/pdf |
| User avatars | — | image/* |

## Password Reset Flow

```
User                           Client                      NestJS Backend           Gmail SMTP
  │                              │                              │                       │
  │  Enter email on              │                              │                       │
  │  /forgot-password            │                              │                       │
  │─────────────────────────────>│                              │                       │
  │                              │  POST /api/auth/             │                       │
  │                              │    forgot-password           │                       │
  │                              │  { email }                   │                       │
  │                              │─────────────────────────────>│                       │
  │                              │                              │ Generate 32-byte      │
  │                              │                              │   random token        │
  │                              │                              │ Store in              │
  │                              │                              │   PasswordResetToken  │
  │                              │                              │   (15-min expiry)     │
  │                              │                              │                       │
  │                              │                              │ Send reset email      │
  │                              │                              │──────────────────────>│
  │                              │                              │                       │
  │  Redirect to                 │                              │                       │
  │  /reset-link-sent?email=...  │                              │                       │
  │<─────────────────────────────│                              │                       │
  │                              │                              │                       │
  │  (User clicks email link)    │                              │                       │
  │  /reset-password?token=...   │                              │                       │
  │─────────────────────────────>│                              │                       │
  │                              │  POST /api/auth/             │                       │
  │  Enter new password          │    reset-password            │                       │
  │                              │  { token, password }         │                       │
  │                              │─────────────────────────────>│                       │
  │                              │                              │ Validate token        │
  │                              │                              │ Check 15-min expiry   │
  │                              │                              │ Hash new password     │
  │                              │                              │ Update user           │
  │                              │                              │ Mark token as used    │
  │  Redirect to /login          │                              │                       │
  │  with success toast          │                              │                       │
  │<─────────────────────────────│                              │                       │
```

## Error Handling & Observability

Request ID tracing flows end-to-end:

1. `RequestIdMiddleware` assigns UUID → sets `X-Request-ID` response header
2. `LoggingInterceptor` logs: `[requestId] METHOD /url userId → status (durationMs)`
3. CORS exposes `X-Request-ID` to the browser
4. Axios response interceptor attaches `error.requestId` to failed requests
5. Error toasts display: `"Something went wrong (Ref: abc-123)"`

## Deployment

### Docker Compose

Two services on a shared bridge network (`galaxy-net`):

```yaml
services:
  client:
    build: ./client
    ports: ['3000:3000']
    environment:
      - NEXT_PUBLIC_API_URL=http://server:8080
    depends_on: [server]

  server:
    build: ./server
    ports: ['8080:8080']
    env_file: ./server/.env
```

The client references the server by Docker service name (`http://server:8080`) for internal network communication.

### Environment Variables

**Server** (`.env.local`): `PORT`, `CLIENT_URL`, `JWT_SECRET`, `INTERNAL_API_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

**Client** (`.env.local`): `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`, `INTERNAL_API_SECRET`, OAuth credentials (Google/GitHub/Facebook), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `DATABASE_URL`, `DIRECT_URL`.

**Database** (`.env`): `DATABASE_URL`, `DIRECT_URL`.
