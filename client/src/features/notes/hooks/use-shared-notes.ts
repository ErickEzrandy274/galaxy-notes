'use client';

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSharedNotes } from '../api/notes-api';
import type { SharedNotesFilters } from '../types';

export function useSharedNotes(filters: SharedNotesFilters) {
  return useQuery({
    queryKey: ['shared-notes', filters],
    queryFn: () => fetchSharedNotes(filters),
  });
}

export function useSharedNotesFilters() {
  const [filters, setFilters] = useState<SharedNotesFilters>({
    page: 1,
    limit: 10,
  });

  const setPermission = useCallback(
    (permission?: 'READ' | 'WRITE') =>
      setFilters((prev) => ({ ...prev, permission, page: 1 })),
    [],
  );

  const setSearch = useCallback(
    (search: string) =>
      setFilters((prev) => ({ ...prev, search: search || undefined, page: 1 })),
    [],
  );

  const setOwnerSearch = useCallback(
    (ownerSearch: string) =>
      setFilters((prev) => ({
        ...prev,
        ownerSearch: ownerSearch || undefined,
        page: 1,
      })),
    [],
  );

  const setTags = useCallback(
    (tags: string) =>
      setFilters((prev) => ({ ...prev, tags: tags || undefined, page: 1 })),
    [],
  );

  const setPage = useCallback(
    (page: number) => setFilters((prev) => ({ ...prev, page })),
    [],
  );

  const setLimit = useCallback(
    (limit: number) => setFilters((prev) => ({ ...prev, limit, page: 1 })),
    [],
  );

  return {
    filters,
    setPermission,
    setSearch,
    setOwnerSearch,
    setTags,
    setPage,
    setLimit,
  };
}
