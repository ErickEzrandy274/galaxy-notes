'use client';

import { useColumnVisibility } from '@/hooks/use-column-visibility';
import type { TrashColumnKey } from '../types';

const DEFAULT_COLUMNS: Record<TrashColumnKey, boolean> = {
  originalStatus: true,
  tags: true,
  createdAt: true,
  deletedOn: true,
  daysLeft: true,
};

export function useTrashColumnVisibility() {
  return useColumnVisibility<TrashColumnKey>({
    storageKey: 'galaxy-notes-trash-column-visibility',
    defaults: DEFAULT_COLUMNS,
  });
}
