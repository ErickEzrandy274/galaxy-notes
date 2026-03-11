# Feature: Auth (Backend)

## Overview

The server-side auth module handles user registration, credentials-based login, and JWT token generation. It integrates with Passport.js for JWT validation on protected routes.

## Module Structure

```
server/src/auth/
├── auth.module.ts          # Module definition (imports, providers, exports)
├── auth.controller.ts      # REST endpoints: POST /register, POST /login
├── auth.service.ts         # Business logic: register, login, token generation
└── strategies/
    └── jwt.strategy.ts     # Passport JWT extraction & validation
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
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `409 Conflict` — Email already registered

**Logic:**
1. Check if user with email already exists (`prisma.user.findUnique`)
2. Hash password with bcrypt (12 salt rounds)
3. Create user with `userType: 'general_user'`
4. Generate and return JWT token

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

**Error Responses:**
- `401 Unauthorized` — Invalid credentials (wrong email/password or OAuth-only user without password)

**Logic:**
1. Find user by email
2. Verify user exists and has a password (OAuth-only users have `null` password)
3. Compare provided password with stored bcrypt hash
4. Return JWT token + user data

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
  firstName String
  lastName  String
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
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
```

The module exports `AuthService` so other modules can use it for auth-related operations.
