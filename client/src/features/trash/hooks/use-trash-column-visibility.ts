'use client';

import { useState } from 'react';
import type { TrashColumnKey } from '../types';

const STORAGE_KEY = 'galaxy-notes-trash-column-visibility';

const DEFAULT_COLUMNS: Record<TrashColumnKey, boolean> = {
  originalStatus: true,
  tags: true,
  createdAt: true,
  deletedOn: true,
  daysLeft: true,
};

function getInitialColumns(): Record<TrashColumnKey, boolean> {
  if (typeof window === 'undefined') return DEFAULT_COLUMNS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_COLUMNS;
  } catch {
    return DEFAULT_COLUMNS;
  }
}

export function useTrashColumnVisibility() {
  const [columns, setColumns] = useState<Record<TrashColumnKey, boolean>>(
    getInitialColumns,
  );

  const toggleColumn = (key: TrashColumnKey) => {
    setColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { columns, toggleColumn };
}
