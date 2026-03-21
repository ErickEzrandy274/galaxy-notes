import { Users } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export function SharedNotesEmptyState() {
  return (
    <EmptyState
      icon={Users}
      title="No shared notes"
      description="Notes shared with you by others will appear here."
    />
  );
}
