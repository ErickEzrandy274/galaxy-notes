# Feature: Auth (Backend)

## Overview

The server-side auth module handles user registration, credentials-based login, OAuth login, token refresh with rotation, logout, and password reset. It integrates with Passport.js for JWT validation on protected routes.

## Module Structure

```
server/src/auth/
├── auth.module.ts          # Module definition (imports, providers, exports)
├── auth.controller.ts      # REST endpoints (7 routes)
├── auth.service.ts         # Business logic: register, login, OAuth, refresh, password reset
├── strategies/
│   └── jwt.strategy.ts     # Passport JWT extraction & validation
├── guards/
│   ├── refresh-token.guard.ts  # Refresh token validation from httpOnly cookie
│   └── login-throttle.guard.ts # Escalating rate limit on failed login attempts
└── dto/
    ├── forgot-password.dto.ts  # Forgot password validation
    └── reset-password.dto.ts   # Reset password validation
```

## API Endpoints

All routes are prefixed with `/api` (global prefix set in `main.ts`).

### POST /api/auth/register

Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "id": "clxyz...",
  "email": "user@example.com",
  "name": "John Doe"
}
```
Also sets `refresh_token` httpOnly cookie.

**Error Responses:**
- `409 Conflict` — Email already registered

**Logic:**
1. Check if user with email already exists (`prisma.user.findUnique`)
2. Hash password with bcrypt (12 salt rounds)
3. Create user with `userType: 'general_user'`
4. Generate JWT access token + refresh token
5. Return access token and user data

### POST /api/auth/login

Authenticates a user with email/password credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123!"
}
```

**Success Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "id": "clxyz...",
  "email": "user@example.com",
  "name": "John Doe"
}
```
Also sets `refresh_token` httpOnly cookie.

**Error Responses:**
- `401 Unauthorized` — Invalid credentials (wrong email/password or OAuth-only user without password)
- `429 Too Many Requests` — Login rate limit exceeded (see Login Rate Limiting below)

### Login Rate Limiting

The `POST /api/auth/login` endpoint is protected by `LoginThrottleGuard`, which enforces escalating cooldowns after repeated failed login attempts per email address.

**Escalation tiers:**

| Batch | Trigger | Cooldown |
|-------|---------|----------|
| 1st | 5 failed attempts | 15 seconds |
| 2nd | 5 more failed attempts | 30 seconds |
| 3rd | 5 more failed attempts | 60 seconds |
| 4th+ | 5 more failed attempts | 2 minutes (cap) |

**Behavior:**
- Tracked in-memory per email address (case-insensitive)
- After 5 consecutive failures, the user is locked out for the current tier's duration
- Once the lockout expires, the user gets 5 fresh attempts; failing again escalates to the next tier
- A successful login clears all tracked attempts and resets the escalation
- The `429` response includes `retryAfter` (seconds until retry is allowed)

**429 Response:**
```json
{
  "statusCode": 429,
  "message": "Too many login attempts. Try again in 15s.",
  "retryAfter": 15
}
```

### POST /api/auth/oauth-login

Handles OAuth sign-in from NextAuth. Called server-side with `X-Internal-Secret` header for verification.

**Logic:** Finds or creates user, sets `userType` based on provider, generates tokens.

### POST /api/auth/refresh

Issues new access token and rotates refresh token. See `token-refresh.md` for details.

### POST /api/auth/logout

Revokes the current refresh token and clears the httpOnly cookie.

### POST /api/auth/forgot-password

Generates a password reset token and sends email.

**Body:** `{ email }`

**Logic:**
1. Find user by email
2. Generate 32-byte random token
3. Store in `PasswordResetToken` table with 15-min expiry
4. Send email via Nodemailer (Gmail SMTP) with reset link

### POST /api/auth/reset-password

Validates reset token and updates password.

**Body:** `{ token, password }`

**Logic:**
1. Find token in `PasswordResetToken` table
2. Validate not expired (15-min window)
3. Hash new password (bcrypt, 12 rounds)
4. Update user's password
5. Mark token as used

## JWT Strategy

- **Extraction**: Bearer token from `Authorization` header (`ExtractJwt.fromAuthHeaderAsBearerToken()`)
- **Secret**: `JWT_SECRET` from environment variables
- **Expiration**: 1 hour (`signOptions: { expiresIn: '1h' }`)
- **Payload**: `{ sub: userId, email: userEmail }`
- **Validated output**: `{ id: payload.sub, email: payload.email }` — attached to `request.user`

## Password Security

- **Algorithm**: bcrypt
- **Salt rounds**: 12
- **Storage**: Hashed password stored in `User.password` field (nullable — OAuth users have no password)

## Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/jwt` | JWT token signing and verification |
| `@nestjs/passport` | Passport integration for NestJS |
| `passport-jwt` | JWT extraction and validation strategy |
| `bcrypt` | Password hashing and comparison |
| `@nestjs/config` | Environment variable access (`JWT_SECRET`) |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Secret key for signing/verifying JWT tokens |
| `DATABASE_URL` | PostgreSQL connection string (used by Prisma) |

## Database Model

The auth module operates on the `User` model:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?  // Nullable — OAuth users have no password
  firstName String?  @map("first_name")
  lastName  String?  @map("last_name")
  userType  UserType @default(general_user)
  // ... other fields
}

enum UserType {
  general_user
  google_user
  github_user
  facebook_user
}
```

## Module Configuration

```typescript
@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenGuard, LoginThrottleGuard],
  exports: [AuthService],
})
```

The module exports `AuthService` so other modules can use it for auth-related operations. `LoginThrottleGuard` is registered as a provider (singleton) to maintain in-memory state across requests.
