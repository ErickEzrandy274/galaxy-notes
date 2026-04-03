import api from '@/lib/axios';
import type { UserPreferences, AutoDeleteBehavior } from '../types';

export async function fetchPreferences(signal?: AbortSignal): Promise<UserPreferences> {
  const response = await api.get<UserPreferences>('/preferences', { signal });
  return response.data;
}

export async function updatePreferences(data: {
  trashRetentionDays?: number;
  autoDeleteBehavior?: AutoDeleteBehavior;
}): Promise<UserPreferences> {
  const response = await api.patch<UserPreferences>('/preferences', data);
  return response.data;
}
