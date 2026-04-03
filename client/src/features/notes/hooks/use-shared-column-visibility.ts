'use client';

import { useSharedColumnVisibilityStore } from '@/stores/column-visibility-store';

export function useSharedColumnVisibility() {
  const columns = useSharedColumnVisibilityStore((s) => s.columns);
  const toggleColumn = useSharedColumnVisibilityStore((s) => s.toggleColumn);
  return { columns, toggleColumn };
}
