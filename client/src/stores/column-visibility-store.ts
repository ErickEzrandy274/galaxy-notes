import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColumnKey, SharedNoteColumnKey } from '@/features/notes/types';

// ─── Notes Column Visibility ────────────────────────────────────────────────

interface ColumnVisibilityState {
  columns: Record<ColumnKey, boolean>;
  toggleColumn: (key: ColumnKey) => void;
}

const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  status: true,
  tags: true,
  createdAt: true,
  lastModified: true,
  shared: true,
};

export const useColumnVisibilityStore = create<ColumnVisibilityState>()(
  persist(
    (set) => ({
      columns: DEFAULT_COLUMNS,
      toggleColumn: (key) =>
        set((state) => ({
          columns: { ...state.columns, [key]: !state.columns[key] },
        })),
    }),
    {
      name: 'galaxy-notes-column-visibility',
    },
  ),
);

// ─── Shared Notes Column Visibility ─────────────────────────────────────────

interface SharedColumnVisibilityState {
  columns: Record<SharedNoteColumnKey, boolean>;
  toggleColumn: (key: SharedNoteColumnKey) => void;
}

const DEFAULT_SHARED_COLUMNS: Record<SharedNoteColumnKey, boolean> = {
  owner: true,
  permission: true,
  tags: true,
  createdAt: true,
  sharedOn: true,
};

export const useSharedColumnVisibilityStore =
  create<SharedColumnVisibilityState>()(
    persist(
      (set) => ({
        columns: DEFAULT_SHARED_COLUMNS,
        toggleColumn: (key) =>
          set((state) => ({
            columns: { ...state.columns, [key]: !state.columns[key] },
          })),
      }),
      {
        name: 'galaxy-notes-shared-column-visibility',
      },
    ),
  );
