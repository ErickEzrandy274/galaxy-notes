import { Archive } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export function ArchivedNotesEmptyState() {
  return (
    <EmptyState
      icon={Archive}
      title="No archived notes"
      description="Notes you archive will appear here for safekeeping."
    />
  );
}
