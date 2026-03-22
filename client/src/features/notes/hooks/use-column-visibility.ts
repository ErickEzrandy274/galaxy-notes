'use client';

import { useColumnVisibility as useGenericColumnVisibility } from '@/hooks/use-column-visibility';
import type { ColumnKey } from '../types';

const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  status: true,
  tags: true,
  createdAt: true,
  lastModified: true,
  shared: true,
};

export function useColumnVisibility() {
  return useGenericColumnVisibility<ColumnKey>({
    storageKey: 'galaxy-notes-column-visibility',
    defaults: DEFAULT_COLUMNS,
  });
}
