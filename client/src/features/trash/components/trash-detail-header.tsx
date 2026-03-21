'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Trash2 } from 'lucide-react';
import { DetailPageHeader, Button } from '@/components/primitives';
import { useRestoreNote, usePermanentDelete } from '../hooks/use-trash-mutations';
import { TrashConfirmDialog } from './trash-confirm-dialog';

interface TrashDetailHeaderProps {
  noteId: string;
  noteTitle: string;
}

export function TrashDetailHeader({ noteId, noteTitle }: TrashDetailHeaderProps) {
  const router = useRouter();
  const restoreMutation = useRestoreNote();
  const deleteMutation = usePermanentDelete();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DetailPageHeader
        backHref="/trash"
        backLabel="Trash"
        title={noteTitle || 'Untitled'}
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              loading={restoreMutation.isPending}
              onClick={() => setShowRestoreDialog(true)}
            >
              {!restoreMutation.isPending && <RotateCcw className="h-3.5 w-3.5" />}
              Restore
            </Button>
            <Button
              variant="destructive-outline"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => setShowDeleteDialog(true)}
            >
              {!deleteMutation.isPending && <Trash2 className="h-3.5 w-3.5" />}
              Delete Permanently
            </Button>
          </>
        }
      />

      <TrashConfirmDialog
        open={showRestoreDialog}
        variant="restore"
        noteTitle={noteTitle}
        onConfirm={() => {
          restoreMutation.mutate(noteId, {
            onSuccess: () => {
              setShowRestoreDialog(false);
              router.push('/notes');
            },
            onSettled: () => setShowRestoreDialog(false),
          });
        }}
        onCancel={() => setShowRestoreDialog(false)}
        isLoading={restoreMutation.isPending}
      />

      <TrashConfirmDialog
        open={showDeleteDialog}
        variant="permanentDelete"
        noteTitle={noteTitle}
        onConfirm={() => {
          deleteMutation.mutate(noteId, {
            onSuccess: () => {
              setShowDeleteDialog(false);
              router.push('/trash');
            },
            onSettled: () => setShowDeleteDialog(false),
          });
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
