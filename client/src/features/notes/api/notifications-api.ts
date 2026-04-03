import api from '@/lib/axios';
import type { NotificationsResponse, NotificationFilter, MutedUser, MuteDuration } from '../types';

export async function fetchNotifications(
  page = 1,
  limit = 10,
  filter?: NotificationFilter,
  signal?: AbortSignal,
): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filter && filter !== 'all') {
    params.set('filter', filter);
  }
  const response = await api.get<NotificationsResponse>(
    `/notifications?${params.toString()}`,
    { signal },
  );
  return response.data;
}

export async function fetchUnreadCount(signal?: AbortSignal): Promise<{ count: number }> {
  const response = await api.get<{ count: number }>('/notifications/unread-count', { signal });
  return response.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

export async function muteUser(
  userId: string,
  duration?: MuteDuration,
): Promise<void> {
  await api.post(`/notifications/mute/${userId}`, { duration });
}

export async function unmuteUser(userId: string): Promise<void> {
  await api.delete(`/notifications/mute/${userId}`);
}

export async function fetchMutedUsers(signal?: AbortSignal): Promise<MutedUser[]> {
  const response = await api.get<MutedUser[]>('/notifications/muted-users', { signal });
  return response.data;
}
