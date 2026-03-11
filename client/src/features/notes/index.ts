// Components
export { NotesPage } from './components/notes-page';
export { NotesTable } from './components/notes-table';
export { NotesTableRow } from './components/notes-table-row';
export { NotesFilters } from './components/notes-filters';
export { NotesSearch } from './components/notes-search';
export { NotesColumnsDropdown } from './components/notes-columns-dropdown';
export { NotesPagination } from './components/notes-pagination';
export { NotesEmptyState } from './components/notes-empty-state';
export { NotesRowActions } from './components/notes-row-actions';
export { StatusBadge } from './components/status-badge';
export { TagBadge, TagList } from './components/tag-badge';
export { NoteEditorPage } from './components/note-editor-page';
export { NoteEditorHeader } from './components/note-editor-header';
export { NoteEditorContent } from './components/note-editor-content';
export { NoteEditorSidebar } from './components/note-editor-sidebar';
export { NoteTagsCombobox } from './components/note-tags-combobox';
export { NoteAttachmentUpload } from './components/note-attachment-upload';
export { NoteYouTubeEmbed } from './components/note-youtube-embed';
export { NoteInfoPanel } from './components/note-info-panel';
export { NoteAutosaveIndicator } from './components/note-autosave-indicator';

// Hooks
export { useNotes } from './hooks/use-notes';
export { useNotesFilters } from './hooks/use-notes-filters';
export { useColumnVisibility } from './hooks/use-column-visibility';
export { useNoteEditor } from './hooks/use-note-editor';
export { useNoteAutosave } from './hooks/use-note-autosave';
export { useNoteTags } from './hooks/use-note-tags';
export { useNoteUpload } from './hooks/use-note-upload';

// Utils
export { getTagColor } from './utils/tag-colors';
export { formatDate } from './utils/format-date';
export { extractYouTubeId, getYouTubeEmbedUrl, isValidYouTubeUrl } from './utils/youtube';
export { countWords, countCharacters } from './utils/word-count';

// Types
export type {
  Note,
  NoteStatus,
  NotesResponse,
  NotesFilters as NotesFiltersType,
  ColumnKey,
  NoteDetail,
  TagOption,
  AutosaveStatus,
  NoteEditorData,
  SignedUploadUrlResponse,
} from './types';
