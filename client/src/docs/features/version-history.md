# Feature: Version History

## Overview

Version history tracks changes to published/shared notes. Users can browse past versions, see diffs (title, content, attachment, video, tags), preview full version content, and restore a previous version.

## Directory Structure

```
client/src/features/notes/
├── components/
│   ├── version-history-drawer.tsx   # Slide-out panel listing versions
│   ├── version-history-item.tsx     # Single version row in the list
│   ├── version-diff-view.tsx        # Side-by-side diff for all tracked fields
│   ├── version-preview-page.tsx     # Full version preview with diff + content
│   └── version-preview-banner.tsx   # Yellow banner with restore/back actions
├── hooks/
│   └── use-version-history.ts       # React Query hook for version list
├── api/
│   └── notes-api.ts                 # fetchVersionHistory, fetchVersionDetail, restoreVersion
└── types/
    └── index.ts                     # NoteVersionSummary, NoteVersionDetail
```

## User Flow

```
Note Detail Page
  → Click "Version History" button (in header)
  → VersionHistoryDrawer slides in from the right
  → Lists versions (version number, title, changed by, date)
  → Click a version → VersionPreviewPage replaces the detail content
  → See diff view + full version content + attachment/video/tags
  → Optionally click "Restore this version"
  → Or click "Back to current" to return
```

## Version History Drawer

- **Hook:** `useVersionHistory(noteId)` with cursor-based pagination
- **List:** Shows version number, title, author name, relative timestamp
- **Load more:** "Load more" button when `hasMore` is true
- **Empty state:** "No version history yet" message

## Version Diff View

Compares the selected version (old) against the current note (new) across six tracked fields:

| Field | Diff Type | Visual |
|-------|-----------|--------|
| Title | Word-level diff (`diffWords`) | Green `<ins>` for additions, red `<del>` for removals |
| Content | Word-level diff (HTML stripped to plain text) | Same as title |
| Attachment | Presence/change comparison | Filename + file size; red del for removed, green ins for added |
| Video URL | Presence/change comparison | Full URL; red del for removed, green ins for added |
| Tags | Array diff | Red del pill for removed, green ins pill for added, neutral pill for unchanged |

**Props:**

```typescript
interface VersionDiffViewProps {
  oldContent: string;      // version content
  newContent: string;      // current content
  oldTitle: string;        // version title
  newTitle: string;        // current title
  oldDocument?: string | null;
  newDocument?: string | null;
  oldDocumentSize?: number | null;
  newDocumentSize?: number | null;
  oldVideoUrl?: string | null;
  newVideoUrl?: string | null;
  oldTags?: string[];
  newTags?: string[];
}
```

**Helper functions:**
- `extractFileName(storagePath)` — extracts filename from storage path, strips timestamp prefix
- `formatFileSize(bytes)` — formats bytes to human-readable (B / KB / MB)
- `stripHtml(html)` — converts HTML to plain text for content diff

Shows "No differences" message when all fields match.

## Version Preview Page

Displays when a version is selected from the drawer:

1. **VersionPreviewBanner** — Yellow/amber banner at top with version info, "Restore this version" button, "Back to current" button
2. **VersionDiffView** — Full diff comparison (all six fields)
3. **Version content section:**
   - Version title
   - Version tags (as pill badges)
   - Version HTML content (sanitized)
   - Version attachment (if any): filename + size, Eye preview button, or "File not available" warning if the file was deleted from storage
   - Version YouTube embed (if any)

## Version Restore

- **API:** `POST /api/notes/:id/versions/:versionId/restore`
- **Behavior:** Backend snapshots the current state first, then overwrites the note with the version's data
- **Restored fields:** `title`, `content`, `document`, `documentSize`, `videoUrl`, `tags`
- **Restrictions:** Cannot restore on archived notes

## NoteVersionDetail Type

```typescript
interface NoteVersionDetail {
  id: string;
  noteId: string;
  version: number;
  title: string;
  content: string;
  changedBy: string;
  changedByName: string;
  createdAt: string;
  // Version's tracked fields
  document: string | null;
  documentSize: number | null;
  documentUrl: string | null;    // Signed URL (null if file deleted)
  videoUrl: string | null;
  tags: string[];
  // Current note's fields (for diff comparison)
  currentContent: string | null;
  currentTitle: string;
  currentDocument: string | null;
  currentDocumentSize: number | null;
  currentDocumentUrl: string | null;
  currentVideoUrl: string | null;
  currentTags: string[];
  noteStatus: NoteStatus;
}
```

## Version Snapshot Triggers

| Trigger | Snapshot? | Condition |
|---------|-----------|-----------|
| Autosave (2s debounce) | Conditional | Only if last snapshot > 10 minutes ago |
| Manual save (button click) | Yes | Unless one was created < 30 seconds ago (dedup) |
| Version restore | Yes | Always snapshots current state before overwriting |

## Dependencies

| Package | Purpose |
|---------|---------|
| `diff` | `diffWords()` for word-level text comparison |
| `dompurify` | HTML sanitization for version content preview |
| `lucide-react` | Icons (Paperclip, Video, Tag, Eye, AlertTriangle) |
