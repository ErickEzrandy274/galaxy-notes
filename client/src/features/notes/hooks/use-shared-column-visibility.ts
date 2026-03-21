'use client';

import { useColumnVisibility } from '@/hooks/use-column-visibility';
import type { SharedNoteColumnKey } from '../types';

const DEFAULT_COLUMNS: Record<SharedNoteColumnKey, boolean> = {
  owner: true,
  permission: true,
  tags: true,
  createdAt: true,
  sharedOn: true,
};

export function useSharedColumnVisibility() {
  return useColumnVisibility<SharedNoteColumnKey>({
    storageKey: 'galaxy-notes-shared-column-visibility',
    defaults: DEFAULT_COLUMNS,
  });
}
