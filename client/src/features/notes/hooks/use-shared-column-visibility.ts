'use client';

import { useState } from 'react';
import type { SharedNoteColumnKey } from '../types';

const STORAGE_KEY = 'galaxy-notes-shared-column-visibility';

const DEFAULT_COLUMNS: Record<SharedNoteColumnKey, boolean> = {
  owner: true,
  permission: true,
  tags: true,
  createdAt: true,
  sharedOn: true,
};

function getInitialColumns(): Record<SharedNoteColumnKey, boolean> {
  if (typeof window === 'undefined') return DEFAULT_COLUMNS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_COLUMNS;
  } catch {
    return DEFAULT_COLUMNS;
  }
}

export function useSharedColumnVisibility() {
  const [columns, setColumns] = useState<Record<SharedNoteColumnKey, boolean>>(
    getInitialColumns,
  );

  const toggleColumn = (key: SharedNoteColumnKey) => {
    setColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { columns, toggleColumn };
}
