# Feature: Token Refresh (Backend)

## Overview

The token refresh endpoint allows authenticated users to obtain a new JWT token before their current token expires, enabling seamless API consumption without re-authentication.

## API Endpoint

### POST /api/auth/refresh

Issues a new JWT token for an authenticated user. The current token must be valid (not expired).

**Headers:**
```
Authorization: Bearer <current-valid-jwt>
```

**Request Body:** None (empty)

**Success Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `401 Unauthorized` — Token is missing, invalid, or expired

**Logic:**
1. JWT guard validates the Bearer token from `Authorization` header
2. Extract `userId` and `email` from the validated JWT payload
3. Sign and return a new JWT with fresh 1-hour expiry

## How It Works

```
Client                              Server
  │                                   │
  │  POST /api/auth/refresh           │
  │  Authorization: Bearer <token>    │
  │──────────────────────────────────→│
  │                                   │
  │                          Passport JWT Guard
  │                          validates token
  │                                   │
  │                          Extract { sub, email }
  │                          from JWT payload
  │                                   │
  │                          Sign new JWT with
  │                          { sub: userId, email }
  │                          expiresIn: '1h'
  │                                   │
  │  { accessToken: "new-jwt..." }    │
  │←──────────────────────────────────│
```

## Authentication

The endpoint is protected by `@UseGuards(AuthGuard('jwt'))`, which:
1. Extracts the Bearer token from the `Authorization` header
2. Verifies the JWT signature using `JWT_SECRET`
3. Checks the token has not expired (`ignoreExpiration: false`)
4. Attaches `{ id, email }` to `request.user` via `JwtStrategy.validate()`

## Token Details

| Property | Value |
|----------|-------|
| Algorithm | HS256 (default for `@nestjs/jwt`) |
| Expiry | 1 hour (`signOptions: { expiresIn: '1h' }`) |
| Payload | `{ sub: userId, email: userEmail }` |
| Signing key | `JWT_SECRET` environment variable |

## Code Location

| File | Change |
|------|--------|
| `server/src/auth/auth.controller.ts` | Added `POST /refresh` route with JWT guard |
| `server/src/auth/auth.service.ts` | Added `refresh(userId, email)` method |

## Usage Pattern

The frontend calls this endpoint through two mechanisms:
- **Axios interceptor (proactive)**: Before each API request, if the token expires within 10 minutes, the interceptor calls `POST /auth/refresh`
- **Periodic background check**: A `useTokenRefresh` hook runs every 10 minutes and triggers `getSession()` → NextAuth JWT callback → `POST /auth/refresh` server-side, ensuring tokens are refreshed even without API activity
- **Reactively**: When a 401 response is received (one retry attempt via axios response interceptor)

## Security Considerations

- The refresh endpoint requires a **valid, non-expired** JWT — it does not accept expired tokens
- No refresh tokens are used; the access token itself serves as proof of authentication
- Each refresh issues a completely new token with a fresh 1-hour window
- The endpoint does not perform database lookups — it trusts the JWT payload validated by Passport

## Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/passport` | `AuthGuard('jwt')` decorator |
| `@nestjs/jwt` | Token signing via `JwtService.sign()` |
| `passport-jwt` | JWT extraction and validation |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Secret key for signing/verifying JWT tokens |
