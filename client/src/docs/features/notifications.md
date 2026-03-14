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
| `restore` | RotateCcw | Green | Yes | `/notes/:noteId` |
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
- Any notification where `isNoteAvailable === false`

## Filter Tabs

| Filter | Behavior |
|--------|----------|
| All | All notifications |
| Unread | Only unread notifications |
| Shared | Notifications with sharing-related types |
| Muted | Notifications from muted users |

## Context Menu Actions

Three-dot dropdown per notification row:

| Action | Behavior |
|--------|---------|
| Mark as read | `PATCH /api/notifications/:id/read` |
| Delete | `DELETE /api/notifications/:id` |
| Mute user | `POST /api/notifications/mute/:userId` (with duration) |

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
