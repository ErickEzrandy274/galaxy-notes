'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, Trash2, Loader2 } from 'lucide-react';
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
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <Link
            href="/trash"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Trash
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">
            {noteTitle || 'Untitled'}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRestoreDialog(true)}
            disabled={restoreMutation.isPending}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {restoreMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Restore
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteMutation.isPending}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-destructive px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete Permanently
          </button>
        </div>
      </header>

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
