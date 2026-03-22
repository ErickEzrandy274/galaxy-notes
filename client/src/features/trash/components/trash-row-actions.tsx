'use client';

import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
} from '@/components/primitives';
import { useRestoreNote, usePermanentDelete } from '../hooks/use-trash-mutations';
import { TrashConfirmDialog } from './trash-confirm-dialog';

interface TrashRowActionsProps {
  noteId: string;
  noteTitle: string;
}

export function TrashRowActions({ noteId, noteTitle }: TrashRowActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const restoreMutation = useRestoreNote();
  const deleteMutation = usePermanentDelete();

  return (
    <>
      <ActionMenu>
        <ActionMenuTrigger />
        <ActionMenuContent>
          <ActionMenuItem
            icon={RotateCcw}
            label="Restore"
            onClick={() => setShowRestoreDialog(true)}
          />
          <ActionMenuSeparator />
          <ActionMenuItem
            icon={Trash2}
            label="Permanently Delete"
            destructive
            onClick={() => setShowDeleteDialog(true)}
          />
        </ActionMenuContent>
      </ActionMenu>

      <TrashConfirmDialog
        open={showDeleteDialog}
        variant="permanentDelete"
        noteTitle={noteTitle}
        onConfirm={() => {
          deleteMutation.mutate(noteId, {
            onSettled: () => setShowDeleteDialog(false),
          });
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={deleteMutation.isPending}
      />

      <TrashConfirmDialog
        open={showRestoreDialog}
        variant="restore"
        noteTitle={noteTitle}
        onConfirm={() => {
          restoreMutation.mutate(noteId, {
            onSettled: () => setShowRestoreDialog(false),
          });
        }}
        onCancel={() => setShowRestoreDialog(false)}
        isLoading={restoreMutation.isPending}
      />
    </>
  );
}
