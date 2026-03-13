import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchVersionHistory } from '../api/notes-api';

export function useVersionHistory(noteId: string, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: ['note-versions', noteId],
    queryFn: ({ pageParam }) => fetchVersionHistory(noteId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    enabled,
  });

  const versions = query.data?.pages.flatMap((page) => page.versions) ?? [];
  const totalVersions = query.data?.pages[0]?.totalVersions ?? 0;

  return {
    versions,
    totalVersions,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
  };
}
