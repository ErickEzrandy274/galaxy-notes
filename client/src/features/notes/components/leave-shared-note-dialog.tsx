'use client';

import { LogOut } from 'lucide-react';

interface LeaveSharedNoteDialogProps {
  open: boolean;
  noteTitle: string;
  ownerName: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LeaveSharedNoteDialog({
  open,
  noteTitle,
  ownerName,
  isLoading,
  onConfirm,
  onCancel,
}: LeaveSharedNoteDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <article className="relative z-10 w-100 rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="flex flex-col items-start gap-3">
          <header className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <LogOut className="h-5 w-5 text-destructive" />
            </span>
            <h2 className="text-left text-lg font-semibold text-foreground">
              Leave shared note?
            </h2>
          </header>
          <p className="mt-1 text-left text-sm text-muted-foreground">
            You will lose access to &quot;{noteTitle}&quot; shared by{' '}
            {ownerName}. This action cannot be undone.
          </p>
        </div>
        <footer className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="cursor-pointer rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
          >
            {isLoading ? 'Leaving...' : 'Leave'}
          </button>
        </footer>
      </article>
    </div>
  );
}
