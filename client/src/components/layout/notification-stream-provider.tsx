'use client';

import { useNotificationStream } from '@/features/notes/hooks/use-notification-stream';

export function NotificationStreamProvider() {
  useNotificationStream();
  return null;
}
