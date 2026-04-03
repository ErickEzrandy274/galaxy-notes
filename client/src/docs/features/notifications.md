# Feature: Notifications Page (Frontend)

## Overview

The Notifications page displays all notifications for the current user with real-time SSE updates, filter tabs, type-specific icons, click-to-navigate behavior, muting, and toast popups for incoming notifications.

## Directory Structure

```
client/src/features/notes/
├── api/notifications-api.ts                 # Notifications API calls via axios
├── components/
│   ├── notifications-page.tsx               # Main orchestrator
│   ├── notification-list.tsx                # Paginated notification list
│   ├── notification-row.tsx                 # Single notification with type-specific icon
│   ├── notification-filter-tabs.tsx         # All/Unread/Shared/Muted filter tabs
│   ├── notification-context-menu.tsx        # Three-dot menu (mark read, delete, mute)
│   ├── notification-empty-state.tsx         # Empty state
│   └── muted-users-list.tsx                 # Muted users management
├── hooks/
│   ├── use-notifications.ts                 # React Query hooks (list, mark read, delete, mute)
│   └── use-notification-stream.tsx          # SSE stream + toast notifications
└── types/index.ts                           # NotificationItem, NotificationsResponse, etc.
```

## Page Route

`/notifications` → `<NotificationsPage />`

## Data Flow

```
useNotifications(filter, page) → React Query (queryKey: ['notifications', filter, page])
        ↓
fetchNotifications(params) → GET /api/notifications?page=&limit=&filter=
        ↓
NotificationsPage renders: FilterTabs + NotificationList + Pagination
```

## Real-Time SSE Stream

`useNotificationStream()` opens an SSE connection to `/api/notifications/stream`:

- **Auth:** JWT passed via `?token=` query param
- **On message:** Refetches notifications query, invalidates shares queries for `share`/`permission_change` types
- **Toast:** Shows a custom toast with type-specific icon, title, and message (5s duration)
- **Navigation:** Clicking the toast navigates to the relevant page
- **Reconnection:** Exponential backoff with jitter (1s initial, 30s max)

## Notification Types and Icons

| Type | Icon | Color | Clickable | Navigation |
|------|------|-------|-----------|------------|
| `share` | Link2 | Purple | Yes | `/shared/:noteId` |
| `permission_change` | ShieldCheck | Blue | Yes | `/shared/:noteId` |
| `edit` | Pencil | Yellow | Yes | `/notes/:noteId` |
| `leave` | LogOut | Red | No (read-only) | — |
| `revoke` | ShieldOff | Red | No (read-only) | — |
| `restore` (owner) | RotateCcw | Green | Yes | `/notes/:noteId` |
| `restore` ("Note Available Again") | RotateCcw | Green | No (read-only) | Three-dot menu: "Request Access" |
| `access_request` | UserPlus | Indigo | No (read-only) | Three-dot menu: "Grant Access" (Can View / Can Edit) or "Decline" |
| `access_granted` | UserCheck | Green | No (read-only) | — |
| `access_declined_by_owner` | UserX | Muted | No (read-only) | — |
| `access_declined` | UserPlus | Red | No (read-only) | — |
| `archive` | Archive | Muted | No (read-only) | — |
| `trash` | Trash2 | Muted | No (read-only) | — |
| `version_cleanup` | Trash2 | Muted | Yes | `/trash/:noteId` |
| Default | Bell | Orange | Yes | `/notes/:noteId` |

## Read-Only Notifications

Certain notification types render as non-clickable rows with reduced opacity (`cursor-default opacity-50`). These use a `<section>` tag instead of `<article>`:

- `leave` — the note owner can't navigate to anything meaningful
- `revoke` — the user lost access, nothing to navigate to
- `archive` — the note was archived by the owner
- `trash` — the shared note was deleted by the owner
- `restore` with title "Note Available Again" — previous collaborator should use "Request Access" in three-dot menu instead
- `access_request` — owner uses Grant/Decline in three-dot menu
- `access_granted` — resolved access request (owner granted access)
- `access_declined_by_owner` — resolved access request (owner declined)
- `access_declined` — requester informed of decline
- Any notification where `isNoteAvailable === false`

## Loading States

- **NotificationFilterTabs** — shows `animate-pulse` rounded pill skeletons matching chip widths while data loads
- **Mark all Read** button includes a `CheckCheck` icon prefix

## Filter Tabs

| Filter | Behavior |
|--------|----------|
| All | All notifications |
| Unread | Only unread notifications |
| Shared | Notifications with sharing-related types |
| Muted | Notifications from muted users |

## Context Menu Actions

Three-dot dropdown per notification row:

| Action | Condition | Behavior |
|--------|-----------|---------|
| View note | Has `noteId`, note available, not read-only type | Navigates to note |
| Request Access | `restore` type with title "Note Available Again" | `POST /api/shares/request-access/:noteId`, shows success toast |
| Grant Access → Can View | `access_request` type | `POST /api/shares/grant-access/:noteId/:userId?permission=READ`, notification type becomes `access_granted` |
| Grant Access → Can Edit | `access_request` type | `POST /api/shares/grant-access/:noteId/:userId?permission=WRITE`, notification type becomes `access_granted` |
| Decline | `access_request` type | `POST /api/shares/decline-access/:noteId/:userId`, notification type becomes `access_declined_by_owner` |
| Mark as read | Notification is unread | `PATCH /api/notifications/:id/read` |
| Mute user | Has `actorId` | `POST /api/notifications/mute/:userId` (with duration) |
| Remove notification | Always | `DELETE /api/notifications/:id` |

## NotificationItem Type

```typescript
interface NotificationItem {
  id: string;
  userId: string;
  actorId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  noteId: string | null;
  createdAt: string;
  actor: NotificationActor | null;
  isNoteAvailable?: boolean;
}
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Data fetching + caching |
| `@radix-ui/react-dropdown-menu` | Context menu dropdown |
| `lucide-react` | Type-specific notification icons |
| `react-hot-toast` | Toast popups for incoming notifications |
