'use client';

import { useState, useCallback } from 'react';
import type { ArchivedNoteColumnKey } from '../types';

const DEFAULT_COLUMNS: Record<ArchivedNoteColumnKey, boolean> = {
  tags: true,
  createdAt: true,
  updatedAt: true,
};

export function useArchivedColumnVisibility() {
  const [columns, setColumns] =
    useState<Record<ArchivedNoteColumnKey, boolean>>(DEFAULT_COLUMNS);

  const toggle = useCallback((key: ArchivedNoteColumnKey) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return { columns, toggle };
}
