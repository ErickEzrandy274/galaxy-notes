'use client';

import { useColumnVisibility } from '@/hooks/use-column-visibility';
import type { ArchivedNoteColumnKey } from '../types';

const DEFAULT_COLUMNS: Record<ArchivedNoteColumnKey, boolean> = {
  tags: true,
  createdAt: true,
  updatedAt: true,
};

export function useArchivedColumnVisibility() {
  const { columns, toggleColumn } = useColumnVisibility<ArchivedNoteColumnKey>({
    defaults: DEFAULT_COLUMNS,
  });

  return { columns, toggle: toggleColumn };
}
