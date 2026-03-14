'use client';

import { FileText } from 'lucide-react';

interface RevertAsDraftDialogProps {
  open: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RevertAsDraftDialog({
  open,
  isLoading,
  onConfirm,
  onCancel,
}: RevertAsDraftDialogProps) {
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
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <FileText className="h-5 w-5 text-amber-500" />
            </span>
            <h4 className="text-left text-lg font-semibold text-foreground">
              Revert to draft?
            </h4>
          </div>
          <p className="mt-1 text-left text-sm text-muted-foreground">
            This note is currently published. Changing it to a draft will
            unpublish it.
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
            className="cursor-pointer rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600/90 disabled:opacity-50"
          >
            {isLoading ? 'Reverting...' : 'Revert as Draft'}
          </button>
        </footer>
      </article>
    </div>
  );
}
