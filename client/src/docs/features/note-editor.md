# Feature: Note Editor

## Overview

The Note Editor provides a rich text editing experience with Quill, PDF attachment upload, YouTube video embedding, tag management, autosave with debounce, and unsaved changes protection.

## Directory Structure

```
client/src/features/notes/
├── components/
│   ├── note-editor-page.tsx          # Main orchestrator (layout + state wiring)
│   ├── note-editor-header.tsx        # Top bar: title input, status, save buttons
│   ├── note-editor-content.tsx       # Quill rich text editor + tag combobox
│   ├── note-editor-sidebar.tsx       # Right sidebar: attachment, share, info, video
│   ├── note-attachment-upload.tsx    # PDF drag-and-drop upload with preview
│   ├── note-youtube-embed.tsx        # YouTube URL input + live embed preview
│   ├── note-tags-combobox.tsx        # Tag input with autocomplete from user's tags
│   ├── note-info-panel.tsx           # Word count, created date, version number
│   ├── note-share-panel.tsx          # Share management (for published notes)
│   ├── note-autosave-indicator.tsx   # Saving/Saved/Error status text
│   ├── quill-editor.tsx              # Quill wrapper with image upload integration
│   ├── publish-confirm-dialog.tsx    # Confirmation dialog for publishing
│   ├── revert-as-draft-dialog.tsx    # Confirmation for reverting published → draft
│   └── unsaved-changes-dialog.tsx    # Leave page warning when dirty
├── hooks/
│   ├── use-note-editor.ts            # Editor state management
│   ├── use-note-autosave.ts          # Debounce + interval save logic
│   └── use-note-upload.ts            # Signed URL upload with progress
└── utils/
    ├── youtube.ts                    # YouTube URL parsing/validation
    └── word-count.ts                 # Content word counter
```

## Page Routes

- **New note:** `/notes/new` → `<NoteEditorPage />` (no `noteId`)
- **Edit note:** `/notes/:id` → `<NoteEditorPage noteId={id} />` (fetches existing note)

## Data Flow

```
useNoteEditor(noteId?)
  → fetches note if editing (React Query)
  → initializes NoteEditorData state
  → provides updateField(), markClean(), version, isDirty

useNoteAutosave({ data, isDirty, version, ... })
  → 2s debounce on change (data save only, no snapshot)
  → 2-minute interval backup
  → localStorage draft recovery
  → saveNow(status) for manual save (with snapshot)
  → unsaved changes guard (beforeunload + link intercept)

NoteEditorPage
  → NoteEditorHeader (title, save buttons)
  → NoteEditorContent (Quill editor + tags)
  → NoteEditorSidebar (attachment + share + info + video)
```

## NoteEditorData Shape

```typescript
interface NoteEditorData {
  title: string;
  content: string;         // HTML from Quill
  tags: string[];
  document: string | null; // Supabase storage path for PDF
  documentSize: number | null; // File size in bytes
  videoUrl: string;        // YouTube URL
  status: NoteStatus;
}
```

## Autosave Behavior

| Trigger | Debounce | Snapshot | Purpose |
|---------|----------|----------|---------|
| Content/field change | 2 seconds | No (`snapshot: false`) | Data safety |
| Periodic interval | 2 minutes | No | Backup |
| Save as Draft / Publish button | Immediate | Yes (`snapshot: true`) | Version history |

**Race condition prevention:** `saveNow()` clears the debounce timer and waits for any in-flight autosave to complete before proceeding. This ensures manual status changes (e.g. publish) aren't silently skipped when an autosave is in progress. Backend also has a 30-second dedup window for manual saves.

**Cache freshness on navigation:** After `saveNow()` completes, all save handlers (`confirmPublish`, `confirmSaveDraft`, `handleSave`) await `queryClient.invalidateQueries({ queryKey: ['notes'], refetchType: 'all' })` before calling `router.push()`. This refetches inactive notes list queries so the cache has fresh data when the user lands on the list page.

**Unsaved changes guard:** Warns on browser close (`beforeunload`) and in-app navigation (capture-phase click intercept on anchor tags). Shows `UnsavedChangesDialog` for in-app nav.

## PDF Attachment Upload

- **Component:** `NoteAttachmentUpload`
- **Hook:** `useNoteUpload(noteId, 'attachment')`
- **Flow:** Drop/click → client-side validation (PDF only, max 3MB) → request signed URL from backend → PUT file directly to Supabase Storage with XHR progress tracking → store `path` and `fileSize` in editor state
- **UI states:** Empty (drop zone) → Uploading (progress bar) → Uploaded (filename + preview/remove buttons)
- **Remove:** Confirmation dialog → sets `document: null, documentSize: null`

## YouTube Video Embed

- **Component:** `NoteYouTubeEmbed`
- **Utils:** `extractYouTubeId()`, `getYouTubeEmbedUrl()`, `isValidYouTubeUrl()`
- **Supports:** youtube.com/watch, youtube.com/embed, youtube.com/shorts, youtu.be short links
- **UI:** Text input with validation → live iframe preview when valid

## Rich Text Editor (Quill)

- **Component:** `QuillEditor` wraps Quill with custom toolbar
- **Image uploads:** Inline images uploaded via `useNoteUpload(noteId, 'rich-text-editor')` (webp/jpeg/png, max 1MB)
- **Blob URL handling:** Images initially inserted as blob URLs, replaced with storage paths by `contentTransform` before saving
- **Sanitization:** Backend strips blob URLs, empty src, and extracts storage paths from signed URLs on save

## Save Buttons

| Button | Condition | Action |
|--------|-----------|--------|
| Save as Draft | Always visible | If published → shows RevertAsDraftDialog; otherwise saves as draft |
| Publish | New note or draft | Shows PublishConfirmDialog → saves as published |
| Save | Already published | Saves as published (no dialog) |
