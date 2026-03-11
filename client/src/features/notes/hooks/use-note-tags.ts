import { useQuery } from '@tanstack/react-query';
import { fetchUserTags } from '../api/notes-api';

export function useNoteTags() {
  return useQuery({
    queryKey: ['note-tags'],
    queryFn: fetchUserTags,
    select: (data) => data.tags,
  });
}
