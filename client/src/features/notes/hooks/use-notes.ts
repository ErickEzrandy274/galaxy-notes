import { useQuery } from '@tanstack/react-query';
import { fetchNotes } from '../api/notes-api';
import type { NotesFilters } from '../types';

export function useNotes(filters: NotesFilters) {
  return useQuery({
    queryKey: ['notes', filters],
    queryFn: ({ signal }) => fetchNotes(filters, signal),
  });
}
