'use client';

import { useCallback, useState } from 'react';
import type { NotesFilters } from '../types';

export function useNotesFilters() {
  const [filters, setFilters] = useState<NotesFilters>({
    page: 1,
    limit: 10,
  });

  const setStatus = useCallback(
    (status?: string) => setFilters((f) => ({ ...f, status, page: 1 })),
    [],
  );

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

  return { filters, setStatus, setSearch, setTags, setPage, setLimit };
}
