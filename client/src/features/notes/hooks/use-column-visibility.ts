'use client';

import { useState } from 'react';
import type { ColumnKey } from '../types';

const STORAGE_KEY = 'galaxy-notes-column-visibility';

const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  status: true,
  tags: true,
  createdAt: true,
  lastModified: true,
  shared: true,
};

function getInitialColumns(): Record<ColumnKey, boolean> {
  if (typeof window === 'undefined') return DEFAULT_COLUMNS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_COLUMNS;
  } catch {
    return DEFAULT_COLUMNS;
  }
}

export function useColumnVisibility() {
  const [columns, setColumns] = useState<Record<ColumnKey, boolean>>(
    getInitialColumns,
  );

  const toggleColumn = (key: ColumnKey) => {
    setColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { columns, toggleColumn };
}
