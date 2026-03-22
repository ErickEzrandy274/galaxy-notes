'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Share2, History, RotateCcw } from 'lucide-react';
import { DetailPageHeader, Button } from '@/components/primitives';
import { useUnarchiveNote } from '../hooks/use-archive-mutations';
import { ArchiveConfirmDialog } from './archive-confirm-dialog';

interface ArchivedNoteDetailHeaderProps {
  noteId: string;
  title: string;
  onOpenHistory: () => void;
}

export function ArchivedNoteDetailHeader({
  noteId,
  title,
  onOpenHistory,
}: ArchivedNoteDetailHeaderProps) {
  const router = useRouter();
  const [showUnarchive, setShowUnarchive] = useState(false);
  const unarchiveMutation = useUnarchiveNote();

  return (
    <>
      <DetailPageHeader
        backHref="/archived"
        backLabel="Archived"
        title={title || 'Untitled'}
        actions={
          <>
            <Button variant="primary" size="sm" disabled>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline-muted" size="sm" disabled>
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button variant="outline-muted" size="sm" onClick={onOpenHistory}>
              <History className="h-3.5 w-3.5" />
              History
            </Button>
            <Button variant="primary-purple" size="sm" onClick={() => setShowUnarchive(true)}>
              <RotateCcw className="h-3.5 w-3.5" />
              Unarchive
            </Button>
          </>
        }
      />
      <ArchiveConfirmDialog
        open={showUnarchive}
        variant="unarchive"
        noteTitle={title}
        onConfirm={() => {
          unarchiveMutation.mutate(noteId, {
            onSuccess: () => {
              setShowUnarchive(false);
              router.push('/archived');
            },
            onSettled: () => setShowUnarchive(false),
          });
        }}
        onCancel={() => setShowUnarchive(false)}
        isLoading={unarchiveMutation.isPending}
      />
    </>
  );
}
