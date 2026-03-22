'use client';

import { useState } from 'react';
import type { TrashFilters } from '../types';

export function useTrashFilters() {
  const [filters, setFilters] = useState<TrashFilters>({
    page: 1,
    limit: 10,
  });

  const setSearch = (search: string) =>
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));

  const setTags = (tags: string) =>
    setFilters((f) => ({ ...f, tags: tags || undefined, page: 1 }));

  const setPage = (page: number) => setFilters((f) => ({ ...f, page }));

  const setLimit = (limit: number) =>
    setFilters((f) => ({ ...f, limit, page: 1 }));

  return { filters, setSearch, setTags, setPage, setLimit };
}
