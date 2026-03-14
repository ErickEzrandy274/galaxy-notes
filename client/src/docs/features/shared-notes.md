# Feature: Shared Notes Page (Frontend)

## Overview

The Shared Notes page displays notes shared *with* the current user by other users. It provides a data table with permission filtering, owner search, column visibility controls, pagination, and row actions (view, edit, leave).

## Directory Structure

```
client/src/features/notes/
├── api/shares-api.ts                        # removeShare(), updatePermission(), etc.
├── components/
│   ├── shared-notes-page.tsx                # Main orchestrator
│   ├── shared-notes-table.tsx               # Table with conditional column headers
│   ├── shared-notes-table-row.tsx           # Single shared note row
│   ├── shared-notes-row-actions.tsx         # Three-dot action menu (view, edit, leave)
│   ├── shared-notes-filters.tsx             # Permission filter tabs (All, Read, Write)
│   ├── shared-notes-search.tsx              # Title search + owner search inputs
│   ├── shared-notes-columns-dropdown.tsx    # Column visibility toggle dropdown
│   ├── shared-notes-empty-state.tsx         # Empty state (no shared notes)
│   ├── shared-note-detail-page.tsx          # Read-only shared note detail view
│   ├── shared-note-detail-header.tsx        # Header for shared note detail
│   ├── leave-shared-note-dialog.tsx         # Leave confirmation dialog
│   └── permission-badge.tsx                 # READ/WRITE permission pill
├── hooks/
│   ├── use-shared-notes.ts                  # React Query hook for shared notes
│   ├── use-shared-column-visibility.ts      # localStorage-backed column toggle
│   └── use-shares.ts                        # Share CRUD mutations (add, remove, update)
└── types/index.ts                           # SharedNote, SharedNotesResponse, etc.
```

## Page Route

`/shared` → `<SharedNotesPage />`
`/shared/:id` → `<SharedNoteDetailPage noteId={id} />`

## Data Flow

```
useSharedNotes(filters) → React Query (queryKey: ['shared-notes', filters])
        ↓
fetchNotes({ ...filters, status: 'shared' }) → GET /api/notes?status=shared&...
        ↓
SharedNotesPage renders: Filters + Search + ColumnsDropdown + Table + Pagination
```

## SharedNote Type

```typescript
interface SharedNote {
  id: string;
  title: string;
  status: NoteStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  owner: SharedNoteOwner;
  shareId: string;          // Used for leave/remove mutations
  permission: 'READ' | 'WRITE';
  sharedOn: string;
}
```

## Filtering

| Filter | Type | Behavior |
|--------|------|----------|
| Permission tabs | Single select | All, Read Only, Read & Write |
| Title search | Text input | Debounced 300ms, case-insensitive |
| Owner search | Text input | Debounced 300ms, matches owner first/last name |

## Column Visibility

Toggleable columns: Owner, Permission, Tags, Created At, Shared On. Title and Actions are always visible.

Stored in `localStorage` under key `galaxy-notes-shared-column-visibility`.

## Row Actions

Three-dot dropdown menu (`SharedNotesRowActions`):

| Action | Condition | Behavior |
|--------|-----------|---------|
| View Note | Always | Navigate to `/shared/:id` |
| Edit Note | `permission === 'WRITE'` | Navigate to `/notes/:id` editor |
| Leave | Always | Opens `LeaveSharedNoteDialog` confirmation |

## Leave Shared Note Dialog

`LeaveSharedNoteDialog` — a modal confirmation before leaving a shared note:

- **Icon:** `LogOut` in destructive/red color
- **Message:** `You will lose access to "{title}" shared by {ownerName}. This action cannot be undone.`
- **Actions:** Cancel (close dialog) / Leave (calls `DELETE /api/shares/:shareId`)
- **Loading state:** Leave button shows spinner while mutation is pending
- **On success:** Invalidates `shared-notes` query, shows success toast

When the recipient leaves, the server sends a `leave` notification to the note owner.

## Dependencies

| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Data fetching + caching |
| `@radix-ui/react-dropdown-menu` | Column visibility + row actions dropdowns |
| `lucide-react` | Icons (Eye, Pencil, LogOut, MoreHorizontal) |
| `react-hot-toast` | Leave success/error notifications |
