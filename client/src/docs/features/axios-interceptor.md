# Feature: Axios Interceptor & Token Refresh (Frontend)

## Overview

The axios interceptor module provides automatic JWT token management for all API requests to the NestJS backend. It handles token attachment, proactive refresh before expiry, and retry logic on 401 responses.

## Module Structure

```
client/src/lib/
├── axios.ts          # Axios instance with interceptors + token cache
└── auth.ts           # NextAuth config (stores accessToken in JWT)

client/src/types/
└── next-auth.d.ts    # NextAuth type augmentation for accessToken
```

## How It Works

### Token Lifecycle

1. **Login**: User logs in via NextAuth Credentials provider → backend returns `accessToken` → stored in NextAuth JWT cookie via `jwt` callback
2. **Hydration**: On first API call, axios reads the token from NextAuth session (`getSession()`) and caches it in memory
3. **Attachment**: Every subsequent request gets `Authorization: Bearer <token>` header automatically
4. **Proactive Refresh**: Before each request, if the token expires within 5 minutes, the interceptor calls `POST /auth/refresh` to get a new token
5. **Retry on 401**: If a response returns 401, the interceptor attempts one refresh and retries the original request
6. **Redirect**: If refresh fails, clears the token and redirects to `/login`

### Token Storage

| Layer | Purpose |
|-------|---------|
| NextAuth JWT cookie | Persistent storage (survives page refresh) |
| In-memory cache (`cachedToken`) | Fast synchronous access (no network call per request) |

### Request Interceptor Flow

```
Request initiated
  ↓
Is token cached in memory?
  ├─ No → Hydrate from NextAuth session (getSession())
  └─ Yes → Continue
  ↓
Is token expiring within 5 minutes?
  ├─ Yes → Call POST /auth/refresh (deduplicated)
  │         ├─ Success → Update cached token
  │         └─ Failure → Clear token
  └─ No → Continue
  ↓
Attach Authorization header
  ↓
Send request
```

### Response Interceptor Flow

```
Response received
  ↓
Is status 401 AND not already retried?
  ├─ Yes → Call POST /auth/refresh (deduplicated)
  │         ├─ Success → Retry original request with new token
  │         └─ Failure → Clear token, redirect to /login
  └─ No → Return response / reject error
```

## Concurrent Request Handling

When multiple requests detect an expiring token simultaneously, only one refresh call is made. All requests await the same `refreshPromise`, preventing duplicate refresh calls.

```typescript
if (!refreshPromise) {
  refreshPromise = refreshToken().finally(() => {
    refreshPromise = null;
  });
}
await refreshPromise;
```

## Exported Functions

| Function | Purpose |
|----------|---------|
| `setAccessToken(token)` | Set the in-memory cached token (called after login) |
| `clearAccessToken()` | Clear the in-memory cached token (called on logout) |
| `default` (api) | The configured axios instance |

## NextAuth Integration

### JWT Callback (`auth.ts`)

The `jwt` callback stores the backend `accessToken` and its expiry timestamp. When the token is near expiry, the callback itself refreshes it server-side:

- **Initial sign-in**: Stores `user.accessToken` and sets `accessTokenExpires` to 55 minutes from now
- **Subsequent calls**: If `accessTokenExpires` has passed, calls `POST /auth/refresh` server-side
- **On failure**: Sets `token.error = 'RefreshTokenError'`

### Session Callback (`auth.ts`)

Exposes `accessToken` and `error` on the session object so client-side code can access them.

### Type Augmentation (`next-auth.d.ts`)

Extends NextAuth types to include:
- `Session.accessToken` — The backend JWT
- `Session.error` — Refresh error indicator
- `User.accessToken` — Backend JWT from login response
- `JWT.accessToken` — Stored in NextAuth JWT cookie
- `JWT.accessTokenExpires` — Expiry timestamp (ms)
- `JWT.error` — Refresh error indicator

## Timing

| Parameter | Value |
|-----------|-------|
| Backend JWT expiry | 1 hour |
| NextAuth session maxAge | 1 hour |
| Proactive refresh buffer (client) | 5 minutes before expiry |
| Server-side refresh threshold | 55 minutes after issue |

## Dependencies

| Package | Purpose |
|---------|---------|
| `axios` | HTTP client |
| `next-auth/react` | `getSession()` for token hydration |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g., `http://localhost:8080/api`) |
