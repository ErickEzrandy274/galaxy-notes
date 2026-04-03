import { useQuery } from '@tanstack/react-query';
import { fetchNoteStats } from '../api/notes-api';

export function useNoteStats() {
  return useQuery({
    queryKey: ['notes', 'stats'],
    queryFn: ({ signal }) => fetchNoteStats(signal),
  });
}
