'use client';

import { useColumnVisibilityStore } from '@/stores/column-visibility-store';

export function useColumnVisibility() {
  const columns = useColumnVisibilityStore((s) => s.columns);
  const toggleColumn = useColumnVisibilityStore((s) => s.toggleColumn);
  return { columns, toggleColumn };
}
