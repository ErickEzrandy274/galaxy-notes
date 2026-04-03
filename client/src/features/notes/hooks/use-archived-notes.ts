'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchArchivedNotes } from '../api/notes-api';
import type { ArchivedNotesFilters } from '../types';

export function useArchivedNotes(filters: ArchivedNotesFilters) {
  return useQuery({
    queryKey: ['notes', 'archived', filters],
    queryFn: ({ signal }) => fetchArchivedNotes(filters, signal),
  });
}

export function useArchivedNotesFilters() {
  const [filters, setFilters] = useState<ArchivedNotesFilters>({
    page: 1,
    limit: 10,
  });

  const setSearch = useCallback(
    (search: string) =>
      setFilters((f) => ({ ...f, search: search || undefined, page: 1 })),
    [],
  );

  const setTags = useCallback(
    (tags: string) =>
      setFilters((f) => ({ ...f, tags: tags || undefined, page: 1 })),
    [],
  );

  const setPage = useCallback(
    (page: number) => setFilters((f) => ({ ...f, page })),
    [],
  );

  const setLimit = useCallback(
    (limit: number) => setFilters((f) => ({ ...f, limit, page: 1 })),
    [],
  );

  return { filters, setSearch, setTags, setPage, setLimit };
}
