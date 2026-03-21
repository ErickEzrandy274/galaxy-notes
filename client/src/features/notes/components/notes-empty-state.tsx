import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export function NotesEmptyState() {
  return (
    <EmptyState
      icon={FileText}
      title="No notes yet"
      description="Create your first note to get started. All your notes will appear here."
    />
  );
}
