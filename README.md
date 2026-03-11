# Galaxy Notes

A full-stack note management application with real-time collaboration, multi-provider authentication, and version history tracking.

## Project Structure

```
galaxy-notes/
├── client/          # Next.js frontend
├── server/          # NestJS backend
├── database/        # Shared Prisma schema & client
├── docker-compose.yml
└── README.md
```

### Client

Next.js 16 frontend with React 19, providing the user interface for note management.

| Tech | Purpose |
|------|---------|
| Next.js 16 (App Router) | Framework & routing |
| React 19 | UI library |
| NextAuth v5 (beta) | Authentication (Google, GitHub, Facebook, Credentials) |
| Tailwind CSS 4 | Styling |
| Radix UI | Accessible UI primitives |
| React Hook Form + Zod | Form handling & validation |
| Axios | HTTP client with JWT interceptor |
| TanStack React Query | Data fetching & caching |
| Lucide React | Icons |

### Server

NestJS 11 backend REST API handling business logic, authentication, and database operations.

| Tech | Purpose |
|------|---------|
| NestJS 11 | Framework |
| Passport + JWT | API authentication |
| bcrypt | Password hashing |
| Nodemailer | Email delivery (SMTP) |
| Prisma | ORM & database access |
| class-validator | Request validation |
| Supabase JS | Supabase service integration |

### Database

Shared Prisma schema package (`@galaxy-notes/database`) defining the PostgreSQL data model hosted on Supabase.

**Models:** User, Account, Session, VerificationToken, PasswordResetToken, Note, NoteShare, NoteVersion, Notification

**Features:** Multi-provider auth (general, Google, GitHub, Facebook), password reset with email tokens, soft delete, note versioning, sharing with READ/WRITE permissions, notifications.

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [pnpm](https://pnpm.io/)
- [PostgreSQL](https://www.postgresql.org/) (or a [Supabase](https://supabase.com/) project)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

## Environment Variables

Copy the `.env.example` file in each directory and fill in the values:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
cp database/.env.example database/.env
```

**Client (`client/.env`):**

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | NextAuth encryption secret |
| `NEXTAUTH_URL` | Client URL (e.g., `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth credentials |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Facebook OAuth credentials |
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g., `http://localhost:8080/api`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon key |
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection string |

**Server (`server/.env`):**

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `8080`) |
| `CLIENT_URL` | Client URL for CORS (e.g., `http://localhost:3000`) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `INTERNAL_API_SECRET` | Server-to-server auth secret for OAuth token issuance |
| `SMTP_HOST` | SMTP server host (default: `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP server port (default: `587`) |
| `SMTP_USER` | SMTP email address |
| `SMTP_PASS` | SMTP password (Gmail: use [App Password](https://myaccount.google.com/apppasswords)) |

**Database (`database/.env`):**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string with PgBouncer pooling |
| `DIRECT_URL` | PostgreSQL direct connection string (used for migrations) |

## Getting Started

### 1. Install dependencies

```bash
# Database
cd database && pnpm install

# Server
cd ../server && pnpm install

# Client
cd ../client && pnpm install
```

### 2. Set up the database

```bash
cd database

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate:dev
```

### 3. Start the server

```bash
cd server

# Development (watch mode)
pnpm start:dev
```

The server runs on `http://localhost:8080` by default.

### 4. Start the client

```bash
cd client

# Development
pnpm dev
```

The client runs on `http://localhost:3000` by default.

## Running with Docker

```bash
docker compose up --build
```

This starts both the client (port 3000) and server (port 8080) in containers connected via the `galaxy-net` bridge network.

## Available Scripts

### Client

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

### Server

| Script | Description |
|--------|-------------|
| `pnpm start:dev` | Start development server (watch mode) |
| `pnpm start:debug` | Start with debugger |
| `pnpm start:prod` | Start production server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm format` | Format code with Prettier |

### Database

| Script | Description |
|--------|-------------|
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate:dev` | Run migrations (development) |
| `pnpm db:migrate:deploy` | Run migrations (production) |
| `pnpm db:push` | Push schema changes without migration |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |
| `pnpm db:seed` | Seed the database |
