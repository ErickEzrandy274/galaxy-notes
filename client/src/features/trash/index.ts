// Components
export { TrashPage } from './components/trash-page';
export { TrashTable } from './components/trash-table';
export { TrashTableRow } from './components/trash-table-row';
export { TrashRowActions } from './components/trash-row-actions';
export { TrashWarningBanner } from './components/trash-warning-banner';
export { TrashEmptyState } from './components/trash-empty-state';
export { TrashConfirmDialog } from './components/trash-confirm-dialog';
export { TrashSearch } from './components/trash-search';
export { TrashColumnsDropdown } from './components/trash-columns-dropdown';
export { DaysLeftBadge } from './components/days-left-badge';
export { TrashSettingsPopover } from './components/trash-settings-popover';

// Hooks
export { useTrash } from './hooks/use-trash';
export { useTrashFilters } from './hooks/use-trash-filters';
export { useTrashColumnVisibility } from './hooks/use-trash-column-visibility';
export { useRestoreNote, usePermanentDelete, useEmptyTrash } from './hooks/use-trash-mutations';
export { usePreferences, useUpdatePreferences } from './hooks/use-preferences';

// Types
export type {
  TrashedNote,
  TrashedNotesResponse,
  TrashFilters,
  TrashColumnKey,
  UserPreferences,
  AutoDeleteBehavior,
} from './types';
