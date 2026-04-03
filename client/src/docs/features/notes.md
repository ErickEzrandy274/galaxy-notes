# Feature: My Notes Dashboard (Frontend)

## Overview

The My Notes dashboard is the primary page for viewing and managing notes. It includes a data table with server-side filtering, search, tag filtering, column visibility controls, pagination, and an empty state.

## Directory Structure

```
client/src/features/notes/
├── api/
│   ├── notes-api.ts                  # Notes CRUD API calls via axios
│   ├── shares-api.ts                 # Shares CRUD API calls
│   └── notifications-api.ts          # Notifications API calls
├── components/
│   ├── notes-page.tsx                # Main orchestrator
│   ├── notes-table.tsx               # Table with conditional column headers
│   ├── notes-table-row.tsx           # Single note row
│   ├── notes-filters.tsx             # Status filter tabs
│   ├── notes-search.tsx              # Search + tag filter inputs
│   ├── notes-columns-dropdown.tsx    # Column visibility toggle dropdown
│   ├── notes-pagination.tsx          # Pagination controls
│   ├── notes-empty-state.tsx         # Empty state (no notes)
│   ├── notes-row-actions.tsx         # Three-dot action menu per row
│   ├── notes-stats.tsx               # Stats cards (total, published, draft, etc.)
│   ├── status-badge.tsx              # Colored status pill
│   ├── tag-badge.tsx                 # Colored tag pill + TagList
│   ├── permission-badge.tsx          # READ/WRITE permission pill
│   ├── archive-confirm-dialog.tsx     # Archive/unarchive confirmation dialog
│   ├── archive-shared-note-dialog.tsx # Warning when archiving shared notes
│   ├── archived-notes-page.tsx        # Archived notes list page (/archived)
│   ├── archived-notes-table.tsx       # Archived notes data table
│   ├── archived-notes-table-row.tsx   # Archived note table row
│   ├── archived-notes-search.tsx      # Search + tag filter for archived notes
│   ├── archived-notes-columns-dropdown.tsx # Column visibility for archived table
│   ├── archived-notes-row-actions.tsx # Three-dot menu (view, unarchive)
│   ├── archived-notes-empty-state.tsx # Empty state for archived notes
│   ├── archived-note-detail-page.tsx  # Read-only archived note detail view
│   ├── archived-note-detail-header.tsx # Header with unarchive button
│   ├── leave-shared-note-dialog.tsx  # Confirmation for leaving a shared note
│   ├── conflict-resolution-dialog.tsx # Optimistic locking conflict resolution
│   ├── share-modal.tsx               # Share management modal
│   ├── share-email-search.tsx        # User email search for sharing
│   ├── share-permission-select.tsx   # Permission select dropdown
│   ├── muted-users-list.tsx          # Muted users management list
│   ├── shared-notes-page.tsx         # Shared Notes page orchestrator
│   ├── shared-notes-table.tsx        # Shared notes data table
│   ├── shared-notes-table-row.tsx    # Single shared note row
│   ├── shared-notes-row-actions.tsx  # Shared note row actions (view, edit, leave)
│   ├── shared-notes-filters.tsx      # Permission filter tabs
│   ├── shared-notes-search.tsx       # Search for shared notes
│   ├── shared-notes-columns-dropdown.tsx # Column visibility for shared notes
│   ├── shared-notes-empty-state.tsx  # Empty state for shared notes
│   ├── shared-note-detail-page.tsx   # Shared note detail view
│   ├── shared-note-detail-header.tsx # Shared note detail header
│   ├── notifications-page.tsx        # Notifications page orchestrator
│   ├── notification-list.tsx         # Notification list with pagination
│   ├── notification-row.tsx          # Single notification row with type-specific icon
│   ├── notification-filter-tabs.tsx  # All/Unread/Shared/Muted filter tabs
│   ├── notification-context-menu.tsx # Notification right-click/three-dot menu
│   └── notification-empty-state.tsx  # Empty state for notifications
├── hooks/
│   ├── use-notes.ts                  # React Query hook for notes
│   ├── use-notes-filters.ts          # Filter/search/page state management
│   ├── use-column-visibility.ts      # Zustand-backed column toggle (persisted to localStorage)
│   ├── use-note-stats.ts             # Note stats hook
│   ├── use-note-tags.ts              # User tags hook
│   ├── use-shared-notes.ts           # React Query hook for shared notes
│   ├── use-shared-column-visibility.ts # Zustand-backed column toggle for shared notes table
│   ├── use-shares.ts                 # Share CRUD mutations + request access
│   ├── use-archive-mutations.ts      # Archive/unarchive mutations
│   ├── use-archived-notes.ts         # React Query hook for archived notes
│   ├── use-archived-column-visibility.ts # Zustand-backed column toggle for archived table
│   ├── use-notifications.ts          # Notification CRUD hooks
│   └── use-notification-stream.tsx   # SSE stream + toast notifications
├── types/index.ts                    # TypeScript interfaces
├── utils/
│   ├── tag-colors.ts                 # Hash-based tag color assignment
│   └── format-date.ts               # Date formatting
└── index.ts                          # Barrel exports
```

## Page Route

`client/src/app/(dashboard)/notes/page.tsx` renders `<NotesPage />` from the feature module.

## Data Flow

```
useNotesFilters() → filters state (status, search, tags, page, limit)
        ↓
useNotes(filters) → React Query (queryKey: ['notes', filters])
        ↓
fetchNotes(filters) → GET /api/notes?page=&limit=&status=&search=&tags=
        ↓
NotesPage renders: NotesFilters + NotesSearch + NotesColumnsDropdown + NotesTable + NotesPagination
```

## Filtering

| Filter | Type | Behavior |
|--------|------|----------|
| Status tabs | Single select | All, Published, Draft, Archived, Shared |
| Title search | Text input | Debounced 300ms, case-insensitive substring match |
| Tag filter | Text input | Debounced 300ms, comma-separated tags with `hasSome` matching |

All filter changes reset pagination to page 1.

## Column Visibility

Toggleable columns: Status, Tags, Created At, Last Modified, Shared. Title and Actions are always visible.

Managed by Zustand store (`useColumnVisibilityStore`) with `persist` middleware. Stored in `localStorage` under key `galaxy-notes-column-visibility`.

## Empty States

- **No notes at all** (total=0, no active filters): Full empty state with icon + "No notes yet" + "+ Create Note" CTA
- **No matching results** (total=0, has active filters): Inline "No notes match your filters" message

## Status Badge Colors

| Status | Style |
|--------|-------|
| published | `bg-green-500/20 text-green-400` |
| draft | `bg-amber-500/20 text-amber-400` |
| archived | `bg-zinc-500/20 text-zinc-400` |
| shared | `bg-blue-500/20 text-blue-400` |

## Tag Colors

8-color palette assigned deterministically via string hash. Same tag always gets the same color. Tags show max 3 visible with "+N" overflow indicator.

## Row Actions

Three-dot dropdown menu with: Edit (navigates to `/notes/:id`), Share (opens share modal), Archive (archives note — shows `ArchiveSharedNoteDialog` warning if note has active shares), Move to Trash (soft delete, then invalidates cache).

Note: Archived notes are excluded from the main notes list and appear on the dedicated `/archived` page instead.

## Dependencies

| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Data fetching + caching |
| `@radix-ui/react-dropdown-menu` | Column visibility + row actions dropdowns |
| `lucide-react` | Icons |
| `react-hot-toast` | Delete success/error notifications |
| `axios` (via `@/lib/axios`) | HTTP client with JWT interceptor + AbortController |
| `zustand` | State management for persisted UI preferences (column visibility) |

## Loading States

All filter section components show skeleton loading states (`animate-pulse`) while data is being fetched:
- **NotesFilters** — rounded pill skeletons matching chip widths
- **NotesSearch** — label + input placeholder skeletons for Title & Tags
- **NotesColumnsDropdown** — single button skeleton
- **NotesStats** — 4 skeleton cards matching stat card dimensions

## Sidebar Updates

The sidebar (`client/src/components/layout/sidebar.tsx`) was updated to match the Figma design:
- Notification badge (red circle with count) on Bell icon
- Dark Mode toggle with moon icon and switch (visual placeholder)
- User three-dot dropdown menu with Settings + Log Out
- Edge chevron collapse/expand toggle
- Smooth 300ms width transition with fade animations on text content (Zustand-managed collapsed state via `useSidebarStore`)
