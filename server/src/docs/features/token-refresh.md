# Feature: Token Refresh (Backend)

## Overview

The token refresh endpoint implements secure token rotation using httpOnly cookie-based refresh tokens with database-backed validation and stolen token detection.

## API Endpoint

### POST /api/auth/refresh

Issues a new JWT access token and rotates the refresh token. Protected by `RefreshTokenGuard`.

**Authentication:** Refresh token from httpOnly cookie (`refresh_token`) or `x-refresh-token` header.

**Request Body:** None (empty)

**Success Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```
Additionally sets a new `refresh_token` httpOnly cookie (token rotation).

**Error Responses:**
- `401 Unauthorized` — Refresh token missing, invalid, expired, or revoked

## How It Works

```
Client                              Server
  │                                   │
  │  POST /api/auth/refresh           │
  │  Cookie: refresh_token=<token>    │
  │──────────────────────────────────→│
  │                                   │
  │                          RefreshTokenGuard:
  │                          1. Extract token from cookie/header
  │                          2. Database lookup (findUnique)
  │                          3. Check not revoked/expired
  │                          4. Detect token reuse (stolen token)
  │                                   │
  │                          auth.service.refreshWithToken():
  │                          1. Revoke current refresh token
  │                          2. Create new refresh token (rotation)
  │                          3. Sign new JWT access token
  │                          4. Set httpOnly cookie with new refresh token
  │                                   │
  │  { accessToken: "new-jwt..." }    │
  │  Set-Cookie: refresh_token=...    │
  │←──────────────────────────────────│
```

## RefreshTokenGuard

The endpoint uses `@UseGuards(RefreshTokenGuard)` (not `AuthGuard('jwt')`):
1. Extracts refresh token from `req.cookies?.['refresh_token']` or `x-refresh-token` header
2. Looks up token in database (`prisma.refreshToken.findUnique`)
3. Validates token is not revoked (`revokedAt` is null)
4. Checks token has not expired (`expiresAt` > now)
5. **Stolen token detection with grace period**: If a revoked token is reused within 30 seconds (`ROTATION_GRACE_MS`), it's treated as a multi-tab race condition — the guard looks up the replacement token via `replacedByToken` and returns it with `isGracePeriodReuse: true`. Outside the grace period, all tokens for that user are revoked (token family invalidation).
6. Attaches `{ token, userId, email, isGracePeriodReuse }` to `req.refreshTokenData`

## Token Rotation

Each refresh performs a full rotation (unless grace period reuse):
1. Current refresh token is revoked (`revokedAt` set)
2. New refresh token is created, linked to old via `replacedByToken`
3. New token set as httpOnly cookie
4. New JWT access token signed and returned

**Grace period reuse**: If `isGracePeriodReuse` is true, the controller skips rotation and issues a new access token using the already-rotated replacement token. This prevents duplicate rotation chains when multiple tabs refresh simultaneously.

## Token Details

| Property | Value |
|----------|-------|
| Access token algorithm | HS256 |
| Access token expiry | 1 hour |
| Access token payload | `{ sub: userId, email: userEmail }` |
| Refresh token storage | Database (`RefreshToken` model) |
| Refresh token delivery | httpOnly cookie |

## Code Location

| File | Purpose |
|------|---------|
| `server/src/auth/auth.controller.ts` | `POST /refresh` route with `RefreshTokenGuard` |
| `server/src/auth/auth.service.ts` | `refreshWithToken()` method — rotation + JWT signing |
| `server/src/auth/guards/refresh-token.guard.ts` | Token extraction, DB validation, stolen token detection |

## Usage Pattern

The frontend calls this endpoint through three mechanisms:
- **Axios interceptor (proactive)**: Before each API request, if the token expires within 10 minutes, the interceptor calls `POST /auth/refresh`
- **Periodic background check**: `useTokenRefresh` hook runs every 5 minutes and triggers `getSession()` → NextAuth JWT callback → `POST /auth/refresh` server-side. Also triggers on tab visibility change and window focus events.
- **Reactively**: When a 401 response is received (one retry attempt via axios response interceptor)

## Security Considerations

- Refresh tokens are stored in the database with expiry and revocation tracking
- Token rotation prevents replay attacks — each refresh token is single-use
- Stolen token detection with 30-second grace period for multi-tab scenarios
- Refresh tokens are delivered via httpOnly cookies (not accessible to JavaScript)
- Database lookups are performed on every refresh to validate token state
- Client enforces 72-hour absolute max session lifetime (via `loginAt` in NextAuth JWT)
- Session hydration capped at 3 retries to prevent infinite loops
- `useTokenRefresh` hook forces sign out on `session.error` detection

## Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/jwt` | Access token signing via `JwtService.sign()` |
| `bcrypt` or `crypto` | Refresh token generation |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Secret key for signing/verifying JWT access tokens |
