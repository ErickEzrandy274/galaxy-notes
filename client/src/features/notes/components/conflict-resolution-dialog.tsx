'use client';

import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

interface ConflictResolutionDialogProps {
  open: boolean;
  noteId: string;
  onKeepMine: () => void;
  onAcceptTheirs: () => void;
  onClose: () => void;
}

export function ConflictResolutionDialog({
  open,
  noteId,
  onKeepMine,
  onAcceptTheirs,
  onClose,
}: ConflictResolutionDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!open) return null;

  const handleViewChanges = () => {
    onClose();
    router.push(`/notes/${noteId}/versions`);
  };

  const handleAcceptTheirs = () => {
    queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    onAcceptTheirs();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <article className="relative z-10 w-100 rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </span>
            <h4 className="text-left text-lg font-semibold text-foreground">
              Edit Conflict
            </h4>
          </div>
          <p className="mt-1 text-left text-sm text-muted-foreground">
            This note has been modified by another user while you were editing.
            Choose how to resolve the conflict.
          </p>
        </div>
        <footer className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleViewChanges}
            className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            View Changes
          </button>
          <button
            type="button"
            onClick={onKeepMine}
            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Keep My Version
          </button>
          <button
            type="button"
            onClick={handleAcceptTheirs}
            className="cursor-pointer rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600/90"
          >
            Accept Theirs
          </button>
        </footer>
      </article>
    </div>
  );
}
