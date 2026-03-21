'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, RotateCcw } from 'lucide-react';
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
} from '@/components/primitives';
import { useUnarchiveNote } from '../hooks/use-archive-mutations';
import { ArchiveConfirmDialog } from './archive-confirm-dialog';

interface ArchivedNotesRowActionsProps {
  noteId: string;
  noteTitle: string;
}

export function ArchivedNotesRowActions({
  noteId,
  noteTitle,
}: ArchivedNotesRowActionsProps) {
  const router = useRouter();
  const [showUnarchive, setShowUnarchive] = useState(false);
  const unarchiveMutation = useUnarchiveNote();

  return (
    <>
      <ActionMenu>
        <ActionMenuTrigger />
        <ActionMenuContent>
          <ActionMenuItem
            icon={Eye}
            label="View Note"
            onClick={() => router.push(`/archived/${noteId}`)}
          />
          <ActionMenuItem
            icon={RotateCcw}
            label="Unarchive"
            onClick={() => setShowUnarchive(true)}
          />
        </ActionMenuContent>
      </ActionMenu>
      <ArchiveConfirmDialog
        open={showUnarchive}
        variant="unarchive"
        noteTitle={noteTitle}
        onConfirm={() => {
          unarchiveMutation.mutate(noteId, {
            onSettled: () => setShowUnarchive(false),
          });
        }}
        onCancel={() => setShowUnarchive(false)}
        isLoading={unarchiveMutation.isPending}
      />
    </>
  );
}
