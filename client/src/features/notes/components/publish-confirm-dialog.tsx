'use client';

import { Upload } from 'lucide-react';

interface PublishConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PublishConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: PublishConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <article className="relative z-10 w-96 rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
            <Upload className="h-5 w-5 text-green-500" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Publish this note?
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              This note will be published and visible to others. You can revert
              it to a draft later.
            </p>
          </div>
        </div>
        <footer className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Publish
          </button>
        </footer>
      </article>
    </div>
  );
}
