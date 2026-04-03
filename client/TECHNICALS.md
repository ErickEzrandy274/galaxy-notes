# Frontend Technical Details

## Provider Hierarchy

The root layout (`app/layout.tsx`) wraps all pages in a provider tree defined in `components/providers.tsx`:

```
<ThemeProvider attribute="class" defaultTheme="dark">
  <SessionProvider>                          ← NextAuth session context
    <TokenRefreshManager />                  ← useTokenRefresh() hook (no UI)
    <QueryClientProvider client={queryClient}>
      {children}                             ← Page content
      <Toaster position="top-right" />       ← react-hot-toast
    </QueryClientProvider>
  </SessionProvider>
</ThemeProvider>
```

`TokenRefreshManager` is a renderless component that runs `useTokenRefresh()` to keep the JWT fresh in the background.

## Route Groups

```
app/
├── (auth)/              # Public routes — Login, Register
│   ├── login/
│   └── register/
├── (dashboard)/         # Authenticated routes
│   ├── notes/
│   │   ├── [id]/        # Note detail (view)
│   │   ├── [id]/edit/   # Note editor
│   │   └── [id]/versions/ # Version history
│   ├── shared/
│   │   └── [id]/        # Shared note detail (read-only or write)
│   ├── notifications/   # Notification center
│   ├── trash/
│   │   └── [id]/        # Trashed note detail (read-only)
│   ├── profile/         # User profile
│   └── settings/        # User settings / preferences
└── (password-reset)/    # Public routes — Password reset flow
    ├── forgot-password/
    ├── reset-link-sent/
    └── reset-password/
```

## Feature Module Pattern

Each feature is self-contained under `src/features/`:

```
features/<name>/
├── api/           # API call functions (axios)
├── components/    # React components (UI)
├── hooks/         # Custom hooks (state, side effects)
├── types/         # TypeScript interfaces
├── utils/         # Helper functions
└── index.ts       # Barrel export
```

## React Query Configuration

Defined in `lib/query-client.ts`:

- **staleTime**: 60 seconds — data is considered fresh for 1 minute
- **retry**: Max 1 retry, except never retry 401/403, auth failures, or canceled requests
- **refetchOnWindowFocus**: disabled

## State Management (Zustand)

Persisted UI preferences use Zustand stores with the `persist` middleware (auto-synced to `localStorage`):

| Store | File | Key | State |
|-------|------|-----|-------|
| `useSidebarStore` | `stores/sidebar-store.ts` | `galaxy-notes-sidebar-collapsed` | `collapsed`, `toggle()` |
| `useColumnVisibilityStore` | `stores/column-visibility-store.ts` | `galaxy-notes-column-visibility` | `columns`, `toggleColumn()` |
| `useSharedColumnVisibilityStore` | `stores/column-visibility-store.ts` | `galaxy-notes-shared-column-visibility` | `columns`, `toggleColumn()` |

Hooks (`use-column-visibility.ts`, `use-shared-column-visibility.ts`) are thin wrappers around the stores for backward-compatible imports.

## Axios Interceptor (`lib/axios.ts`)

The axios instance manages JWT tokens automatically with request and response interceptors. Supports AbortController for request cancellation (see below).

### Token Cache

Tokens are cached in module-level variables for synchronous access:

- `cachedToken` — the JWT string
- `tokenExpiry` — decoded `exp` claim (milliseconds)
- `authFailed` — flag set on permanent auth failure; blocks all subsequent requests
- `sessionPromise` — shared promise for initial session hydration (prevents duplicate `getSession()` calls)

### Request Interceptor

Runs before every API call:

```
Request initiated
  │
  ├─ authFailed? → Reject immediately
  │
  ├─ No cached token? → Hydrate from NextAuth session (getSession())
  │                     Uses shared sessionPromise to deduplicate
  │
  ├─ Token expires within 10 min?
  │    └─ Yes → POST /api/auth/refresh (via httpOnly cookie)
  │              Deduplicated via shared refreshPromise
  │
  └─ Attach Authorization: Bearer <token>
```

### Response Interceptor

Handles cancelled requests, 401 retry, and error toasts:

```
Error received
  │
  ├─ Cancelled (AbortController)? → Silently reject (no toast)
  │
  ├─ authFailed? → Reject (no processing)
  │
  ├─ Status 401 AND not already retried?
  │    ├─ Refresh token → Success → Retry original request
  │    └─ Refresh failed → Set authFailed=true
  │                        → logout() (revoke refresh token on backend)
  │                        → signOut() (NextAuth redirect to /login)
  │
  └─ Show error toast: "message (Ref: requestId)"
```

### Exported Functions

| Function | Purpose |
|----------|---------|
| `setAccessToken(token)` | Cache token + decode expiry |
| `clearAccessToken()` | Clear cache |
| `isTokenExpiringSoon()` | `true` if token expires within 10 minutes |
| `resetAuthState()` | Clear all cached state (token, promises, flags) |
| `logout()` | POST to `/auth/logout` to revoke refresh token, then reset state |
| `getAccessToken()` | Return the current in-memory access token (for EventSource, etc.) |
| `default` (api) | The configured axios instance |

## Request Cancellation (AbortController)

All GET API functions accept an optional `signal?: AbortSignal` parameter. TanStack Query's `queryFn` context provides the signal automatically:

```
queryFn: ({ signal }) => fetchNotes(filters, signal)
  → api.get('/notes', { signal })
```

Requests are automatically cancelled when components unmount or query keys change. The response interceptor uses `isCancel(error)` to skip error toasts for cancelled requests. Mutations do not use AbortController.

## Periodic Token Refresh (`use-token-refresh.ts`)

The `useTokenRefresh` hook runs inside `TokenRefreshManager` and keeps tokens fresh through three triggers:

1. **Interval** (every 5 minutes): Checks `isTokenExpiringSoon()`, calls `getSession()` if true
2. **Visibility change**: Fires when tab becomes visible (solves browser throttling of `setInterval` in background tabs)
3. **Window focus**: Fires on alt-tab back to the app

`getSession()` triggers the NextAuth JWT callback server-side. The JWT callback checks `accessTokenExpires` and, if expired, calls `POST /api/auth/refresh` using the `X-Refresh-Token` header.

### Concurrency Guard

A `refreshingRef` prevents overlapping refresh calls from multiple triggers firing simultaneously.

## NextAuth Configuration (`lib/auth.ts`)

### Session Strategy

JWT-based sessions with 24-hour maxAge. Custom pages: `/login` for both signIn and error.

### Providers

- **Google**, **GitHub**, **Facebook** — all with `allowDangerousEmailAccountLinking: true` (allows linking multiple OAuth providers to the same email)
- **Credentials** — calls `POST /api/auth/login`, extracts `refresh_token` from `Set-Cookie` header

### Callbacks

**`jwt` callback:**
- Initial sign-in: stores `accessToken`, `refreshToken`, sets `accessTokenExpires` to now + 55 minutes
- OAuth: calls `POST /api/auth/oauth-login` with `X-Internal-Secret` header to get backend JWT
- Subsequent calls: returns cached token if not expired, otherwise refreshes via `X-Refresh-Token` header

**`session` callback:**
- Exposes `accessToken` and `error` on the session object

### Events

**`linkAccount`:** Sets `userType` on the User model based on OAuth provider (only if currently `general_user`).

## Autosave System (`use-note-autosave.ts`)

### Triggers

| Trigger | Interval | Condition |
|---------|----------|-----------|
| Debounce | 2 seconds after last change | Any field changed |
| Background interval | Every 2 minutes | Has unsaved changes |
| Manual save | Immediate | User clicks Save |

### Manual Save Dedup

When `saveNow()` is called (manual save), it clears the pending debounce timer via `clearTimeout(debounceRef.current)`. This prevents the scenario where a debounce fires right before/after the manual save, creating a duplicate version.

### Draft Recovery

Every field change persists the current editor state to `localStorage` keyed by note ID. On page load, if a draft exists for the note, it is restored into the editor. This prevents data loss from browser crashes or accidental navigation.

### Save Payload

The autosave sends to `PATCH /api/notes/:id`:
- `title`, `content`, `status`, `document`, `documentSize`, `videoUrl`, `tags`, `version`

The `version` field enables optimistic locking — the backend returns 409 if the database version doesn't match.

## Version Diff View (`version-diff-view.tsx`)

Compares a historical `NoteVersion` against the current note state across five dimensions:

### Diff Sections

1. **Title** — Side-by-side text comparison (red del / green ins)
2. **Content** — Side-by-side with "No content" placeholder for empty
3. **Attachment** — Shows filename + formatted file size (e.g., "report.pdf (1.2 MB)")
   - Added: green ins with Paperclip icon
   - Removed: red del
   - Changed: del old + ins new
4. **Video URL** — URL comparison with Video icon
   - Added/removed/changed indicators
5. **Tags** — Array diff with colored pill badges
   - Removed: red del pill
   - Added: green ins pill
   - Unchanged: neutral pill

### Helpers

- `extractFileName(storagePath)` — extracts filename from Supabase storage path
- `formatFileSize(bytes)` — converts bytes to human-readable (e.g., "1.2 MB", "340 KB")

### No Changes State

`hasDifferences` checks all five dimensions. If none differ, displays "No differences found" message.

## Version Preview Page (`version-preview-page.tsx`)

Displays a historical version with:

1. **Version metadata** — version number, date, "changes from" summary
2. **Diff view** — `VersionDiffView` component with all five diff sections
3. **Attachment preview** — Paperclip icon, filename + formatted size, Eye icon for preview. If `documentUrl` is null but `document` path exists, shows "File {filename} not available" warning
4. **YouTube embed** — Renders embedded player if version has `videoUrl` (reuses `extractYouTubeId`/`getYouTubeEmbedUrl` from `utils/youtube.ts`)
5. **Tags** — Displayed as pill badges (same style as `note-detail-content.tsx`)
6. **Restore button** — Restores note to this version's state

## File Upload Flow (Client Side)

### `use-note-upload.ts`

1. Calls `POST /api/notes/:id/upload-url` with `{ fileName, mimeType }`
2. Receives `{ signedUrl, path }`
3. PUTs file binary directly to Supabase Storage via `signedUrl`
4. Returns `{ path, downloadUrl, fileSize: file.size }`

The `fileSize` is stored as `documentSize` on the note for display in version diff.

### `note-attachment-upload.tsx`

- Accepts PDF files only (max 3 MB)
- `onChange(url, fileSize)` callback updates both `document` and `documentSize` fields
- Shows filename, preview button, and remove button when a file is attached

## Sidebar Collapse Animation

The sidebar uses smooth CSS transitions (`transition-[width] duration-300 ease-in-out`) for the width change. Inner content (labels, version text, user info) uses `opacity` + `width` transitions instead of conditional rendering to avoid layout shifts. The collapsed state is managed via `useSidebarStore` (Zustand with `persist` middleware).

## Loading Skeleton States

All filter section components accept an `isLoading` prop and render `animate-pulse` skeleton placeholders:
- **Filter chips** (NotesFilters, SharedNotesFilters, NotificationFilterTabs) — rounded pill skeletons sized proportionally to label text
- **Search inputs** (NotesSearch, SharedNotesSearch) — label + input box skeletons
- **Column dropdowns** (NotesColumnsDropdown, SharedNotesColumnsDropdown) — single button skeleton
- **Stats cards** (NotesStats) — 4 skeleton cards matching stat card height

## Error Toast Pattern

The axios response interceptor automatically shows `react-hot-toast` notifications for API errors:
- Skipped during 401 retry attempts
- Message comes from `error.response.data.message` (fallback: "Something went wrong")
- Appends request ID suffix: `(Ref: abc-123)` when `X-Request-ID` header is present

## Notification Stream (`use-notification-stream.tsx`)

Opens an SSE connection to `/api/notifications/stream` for real-time notification delivery.

### Connection

- JWT token passed via `?token=` query param (EventSource doesn't support custom headers)
- Exponential backoff with jitter on disconnect (1s initial, 30s max)
- Cleans up on component unmount

### On Message

1. Refetches `['notifications']` query to update the notification list
2. Invalidates `['shares']` query for `share`/`permission_change` types (live-updates the share modal)
3. Shows a custom toast notification with type-specific icon and message (5s duration)

### Toast Icons

| Type | Icon | Color |
|------|------|-------|
| `share` | Link2 | purple |
| `permission_change` | ShieldCheck | blue |
| `edit` | Pencil | yellow |
| `leave` | LogOut | red |
| `restore` | RotateCcw | green |
| `trash` / `version_cleanup` | Trash2 | muted |

### Toast Navigation

Clicking a toast dismisses it and navigates to the relevant page:
- `share` / `permission_change` → `/shared/:noteId`
- `version_cleanup` → `/trash/:noteId`
- Default → `/notes/:noteId`

## Shared Notes Page

The Shared Notes page displays notes shared *with* the current user by other users. Uses `GET /api/notes?status=shared` with additional filters: `permission`, `ownerSearch`.

### Leave Flow

1. User clicks "Leave" in row actions dropdown
2. `LeaveSharedNoteDialog` opens with confirmation message showing note title and owner name
3. On confirm → `DELETE /api/shares/:shareId` (using `shareId` from the shared notes response)
4. Server allows recipient to delete their own share and sends a `leave` notification to the owner
5. On success → invalidates `shared-notes` query, shows success toast

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXTAUTH_SECRET` | NextAuth encryption key |
| `NEXTAUTH_URL` | NextAuth base URL |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g., `http://localhost:8080/api`) |
| `INTERNAL_API_SECRET` | Shared secret for NextAuth → backend server-to-server calls |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | Facebook OAuth |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon key (client-side) |
| `DATABASE_URL` | PostgreSQL via PgBouncer (for NextAuth PrismaAdapter) |
| `DIRECT_URL` | PostgreSQL direct connection (migrations) |
