'use client';

import { useState } from 'react';

interface UseColumnVisibilityOptions<K extends string> {
  storageKey?: string;
  defaults: Record<K, boolean>;
}

function getInitialColumns<K extends string>(
  storageKey: string | undefined,
  defaults: Record<K, boolean>,
): Record<K, boolean> {
  if (!storageKey || typeof window === 'undefined') return defaults;
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : defaults;
  } catch {
    return defaults;
  }
}

export function useColumnVisibility<K extends string>({
  storageKey,
  defaults,
}: UseColumnVisibilityOptions<K>) {
  const [columns, setColumns] = useState<Record<K, boolean>>(() =>
    getInitialColumns(storageKey, defaults),
  );

  const toggleColumn = (key: K) => {
    setColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });
  };

  return { columns, toggleColumn };
}
