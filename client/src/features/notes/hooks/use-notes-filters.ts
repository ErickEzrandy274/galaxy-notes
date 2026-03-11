'use client';

import { useState } from 'react';
import type { NotesFilters } from '../types';

export function useNotesFilters() {
  const [filters, setFilters] = useState<NotesFilters>({
    page: 1,
    limit: 6,
  });

  const setStatus = (status?: string) =>
    setFilters((f) => ({ ...f, status, page: 1 }));

  const setSearch = (search: string) =>
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));

  const setTags = (tags: string) =>
    setFilters((f) => ({ ...f, tags: tags || undefined, page: 1 }));

  const setPage = (page: number) => setFilters((f) => ({ ...f, page }));

  return { filters, setStatus, setSearch, setTags, setPage };
}
