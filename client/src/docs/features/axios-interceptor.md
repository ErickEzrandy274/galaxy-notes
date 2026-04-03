# Feature: Axios Interceptor & Token Refresh (Frontend)

## Overview

The axios interceptor module provides automatic JWT token management for all API requests to the NestJS backend. It handles token attachment, proactive refresh before expiry, and retry logic on 401 responses.

## Module Structure

```
client/src/lib/
├── axios.ts          # Axios instance with interceptors + token cache
└── auth.ts           # NextAuth config (stores accessToken in JWT)

client/src/features/auth/hooks/
└── use-token-refresh.ts  # Periodic background token refresh (5-min interval)

client/src/components/
└── providers.tsx     # TokenRefreshManager component runs useTokenRefresh()

client/src/types/
└── next-auth.d.ts    # NextAuth type augmentation for accessToken
```

## How It Works

### Token Lifecycle

1. **Login**: User logs in via NextAuth Credentials provider → backend returns `accessToken` → stored in NextAuth JWT cookie via `jwt` callback. `loginAt` timestamp recorded for absolute session limit.
2. **Hydration**: On first API call, axios reads the token from NextAuth session (`getSession()`) and caches it in memory. Max 3 hydration retries before setting `authFailed`. Checks `session.error` for `RefreshTokenError`/`SessionExpired`.
3. **Attachment**: Every subsequent request gets `Authorization: Bearer <token>` header automatically
4. **Proactive Refresh**: Before each request, if the token expires within 10 minutes, the interceptor calls `POST /auth/refresh` to get a new token
5. **Periodic Background Refresh**: A `useTokenRefresh` hook runs a 5-minute interval that checks `isTokenExpiringSoon()` and calls `getSession()` to trigger a server-side refresh. Also triggers on tab visibility change and window focus events. Forces sign out if `session.error` detected.
6. **Retry on 401**: If a response returns 401, the interceptor attempts one refresh and retries the original request
7. **Redirect**: If refresh fails, calls `logout()` (revokes refresh token on backend, resets auth state) then `signOut()` from NextAuth to redirect to `/login`
8. **Absolute Expiry**: After 72 hours from login (`loginAt`), the NextAuth JWT callback sets `token.error = 'SessionExpired'` — no further refresh attempts, user must re-authenticate

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
Is token expiring within 10 minutes?
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
Error received
  ↓
Is request cancelled (AbortController)?
  ├─ Yes → Silently reject (no toast)
  └─ No → Continue
  ↓
Is status 401 AND not already retried?
  ├─ Yes → Call POST /auth/refresh (deduplicated)
  │         ├─ Success → Retry original request with new token
  │         └─ Failure → Clear token, redirect to /login
  └─ No → Show error toast with request ID, reject error
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

## Request Cancellation (AbortController)

All GET API functions accept an optional `signal?: AbortSignal` parameter, forwarded from TanStack Query's `queryFn` context:

```typescript
// API layer
export async function fetchNotes(filters, signal?: AbortSignal) {
  const response = await api.get('/notes', { signal });
  return response.data;
}

// Hook layer
queryFn: ({ signal }) => fetchNotes(filters, signal),
```

TanStack Query automatically creates an `AbortSignal` and aborts in-flight requests when:
- The component unmounts (e.g., navigating away)
- The query key changes (e.g., changing filters rapidly)
- The query is manually invalidated

The response interceptor checks `isCancel(error)` and silently rejects cancelled requests without showing error toasts.

Mutations (`useMutation`) intentionally do **not** use AbortController — they are user-initiated write operations that should always complete.

## Exported Functions

| Function | Purpose |
|----------|---------|
| `setAccessToken(token)` | Set the in-memory cached token (called after login) |
| `clearAccessToken()` | Clear the in-memory cached token |
| `resetAuthState()` | Clear cached token and refresh promise |
| `logout()` | POST to `/auth/logout` to revoke refresh token, then reset auth state |
| `isTokenExpiringSoon()` | Returns `true` if token expires within 10 minutes (used by periodic refresh hook) |
| `getAccessToken()` | Return the current in-memory access token (for EventSource, etc.) |
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
| Proactive refresh buffer (client) | 10 minutes before expiry |
| Periodic background check interval | Every 5 minutes (via `useTokenRefresh` hook) |
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
