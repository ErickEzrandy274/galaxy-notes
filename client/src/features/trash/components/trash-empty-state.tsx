import { Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

interface TrashEmptyStateProps {
  retentionDays: number;
}

export function TrashEmptyState({ retentionDays }: TrashEmptyStateProps) {
  return (
    <EmptyState
      icon={Trash2}
      title="Trash is empty"
      description={`Deleted notes will appear here. Items are permanently removed after ${retentionDays} days.`}
    />
  );
}
