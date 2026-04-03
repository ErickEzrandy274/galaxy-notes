import type { Metadata } from 'next';
import { NotificationsPage } from '@/features/notes';

export const metadata: Metadata = { title: 'Notifications' };

export default function NotificationsRoute() {
  return <NotificationsPage />;
}
