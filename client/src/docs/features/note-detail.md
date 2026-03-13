# Feature: Note Detail View

## Overview

The Note Detail page displays a read-only view of a note with its content, metadata, PDF attachment, YouTube video, tags, sharing info, and version history access.

## Directory Structure

```
client/src/features/notes/components/
├── note-detail-page.tsx       # Main orchestrator (fetch + layout routing)
├── note-detail-header.tsx     # Top bar: back, title, status, edit/archive/delete actions
├── note-detail-content.tsx    # Content display + sidebar (attachment, video)
├── image-lightbox.tsx         # Full-size image preview modal
├── version-history-drawer.tsx # Slide-out version history panel
└── version-preview-page.tsx   # Version preview (replaces detail content)
```

## Page Route

`/notes/:id` → `<NoteDetailPage noteId={id} />`

The page conditionally renders either the detail view or a version preview (when a version is selected from the history drawer).

## Layout

```
┌─────────────────────────────────────────────────────┐
│ NoteDetailHeader (← Back, title, status, actions)   │
├───────────────────────────────┬─────────────────────┤
│ Main Content                  │ Sidebar (w-96)      │
│ • Title (h1)                  │ • Attachment (PDF)  │
│ • Status badge + last edited  │ • Video (YouTube)   │
│ • Tags (TagList)              │                     │
│ • HTML content (sanitized)    │                     │
└───────────────────────────────┴─────────────────────┘
```

The sidebar only renders if the note has an attachment (`document`) or video (`videoUrl`).

## Content Display

- HTML content is sanitized with DOMPurify (allowlisted tags: p, br, strong, em, u, s, a, img, ul, ol, li, h1-h3, blockquote, pre, code, span, sub, sup)
- Inline images are clickable → opens `ImageLightbox` modal
- Empty paragraphs and `<br>`-only paragraphs maintain minimum height

## Attachment Sidebar

- Extracts filename from storage path (strips timestamp prefix)
- **Preview button** (Eye icon): opens signed URL in new tab
- **Download button:** fetches blob → creates object URL → triggers download with original filename

## Video Sidebar

- Extracts YouTube ID via `extractYouTubeId()`
- Renders responsive iframe embed (`aspect-video w-full`)

## Header Actions

| Action | Condition | Behavior |
|--------|-----------|---------|
| Edit | Owner or WRITE share | Navigate to `/notes/:id` editor |
| Version History | Non-draft, non-archived | Opens `VersionHistoryDrawer` |
| Archive | Owner, not archived | Soft archive |
| Move to Trash | Owner | Soft delete |

## Data Fetching

Uses `fetchNote(noteId)` via React Query. The response includes:
- `document` — storage path of PDF attachment
- `documentUrl` — signed download URL (null if no attachment)
- `documentSize` — file size in bytes
- `videoUrl` — YouTube URL
- `tags` — string array
