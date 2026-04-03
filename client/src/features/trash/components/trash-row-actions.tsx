'use client';

import { useState } from 'react';
import { MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <MoreHorizontal size={18} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            className="z-50 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg"
          >
            <DropdownMenu.Item
              onClick={() => setShowRestoreDialog(true)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
            >
              <RotateCcw size={14} />
              Restore
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              onClick={() => setShowDeleteDialog(true)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
            >
              <Trash2 size={14} />
              Permanently Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

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
