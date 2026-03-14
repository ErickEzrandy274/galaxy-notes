'use client';

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  muteUser,
  unmuteUser,
  fetchMutedUsers,
} from '../api/notifications-api';
import type { NotificationFilter, NotificationsResponse, MuteDuration } from '../types';

export function useNotifications(page = 1, filter: NotificationFilter = 'all') {
  return useQuery({
    queryKey: ['notifications', page, filter],
    queryFn: () => fetchNotifications(page, 10, filter),
  });
}

export function useInfiniteNotifications(
  filter: NotificationFilter = 'all',
  limit = 10,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery<NotificationsResponse>({
    queryKey: ['notifications', 'infinite', filter],
    queryFn: ({ pageParam }) =>
      fetchNotifications(pageParam as number, limit, filter),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: options?.enabled,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMuteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      duration,
    }: {
      userId: string;
      duration?: MuteDuration;
    }) => muteUser(userId, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUnmuteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unmuteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMutedUsers() {
  return useQuery({
    queryKey: ['notifications', 'muted-users'],
    queryFn: fetchMutedUsers,
  });
}
