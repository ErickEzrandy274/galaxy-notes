import { useQuery } from '@tanstack/react-query';
import { fetchTrashedNotes } from '../api/trash-api';
import type { TrashFilters } from '../types';

export function useTrash(filters: TrashFilters) {
  return useQuery({
    queryKey: ['notes', 'trash', filters],
    queryFn: ({ signal }) => fetchTrashedNotes(filters, signal),
  });
}
