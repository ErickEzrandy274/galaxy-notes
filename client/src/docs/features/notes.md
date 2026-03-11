# Feature: My Notes Dashboard (Frontend)

## Overview

The My Notes dashboard is the primary page for viewing and managing notes. It includes a data table with server-side filtering, search, tag filtering, column visibility controls, pagination, and an empty state.

## Directory Structure

```
client/src/features/notes/
├── api/notes-api.ts                  # API calls via axios
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
│   ├── status-badge.tsx              # Colored status pill
│   └── tag-badge.tsx                 # Colored tag pill + TagList
├── hooks/
│   ├── use-notes.ts                  # React Query hook for notes
│   ├── use-notes-filters.ts          # Filter/search/page state management
│   └── use-column-visibility.ts      # localStorage-backed column toggle
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

Stored in `localStorage` under key `galaxy-notes-column-visibility`.

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

Three-dot dropdown menu with: Edit (navigates to `/notes/:id`), Share, Move to Trash (soft delete with optimistic cache invalidation).

## Dependencies

| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Data fetching + caching |
| `@radix-ui/react-dropdown-menu` | Column visibility + row actions dropdowns |
| `lucide-react` | Icons |
| `react-hot-toast` | Delete success/error notifications |
| `axios` (via `@/lib/axios`) | HTTP client with JWT interceptor |

## Sidebar Updates

The sidebar (`client/src/components/layout/sidebar.tsx`) was updated to match the Figma design:
- Notification badge (red circle with count) on Bell icon
- Dark Mode toggle with moon icon and switch (visual placeholder)
- User three-dot dropdown menu with Settings + Log Out
- Edge chevron collapse/expand toggle
