'use client';

import { useRouter } from 'next/navigation';
import { Pencil, History } from 'lucide-react';
import { DetailPageHeader, Button } from '@/components/primitives';
import { PermissionBadge } from './permission-badge';

interface SharedNoteDetailHeaderProps {
  noteId: string;
  title: string;
  permission: 'READ' | 'WRITE';
  onOpenHistory: () => void;
}

export function SharedNoteDetailHeader({
  noteId,
  title,
  permission,
  onOpenHistory,
}: SharedNoteDetailHeaderProps) {
  const router = useRouter();

  return (
    <DetailPageHeader
      backHref="/shared"
      backLabel="Shared with Me"
      title={title || 'Untitled'}
      titleSuffix={<PermissionBadge permission={permission} />}
      actions={
        <>
          {permission === 'WRITE' && (
            <Button variant="primary" size="sm" onClick={() => router.push(`/notes/${noteId}`)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          <Button variant="outline-muted" size="sm" onClick={onOpenHistory}>
            <History className="h-3.5 w-3.5" />
            History
          </Button>
        </>
      }
    />
  );
}
