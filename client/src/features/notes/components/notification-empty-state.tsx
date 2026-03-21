import { Bell } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export function NotificationEmptyState() {
  return (
    <EmptyState
      icon={Bell}
      title="No notifications yet"
      description="When someone shares a note with you or makes changes to a shared note, you'll see notifications here."
    />
  );
}
