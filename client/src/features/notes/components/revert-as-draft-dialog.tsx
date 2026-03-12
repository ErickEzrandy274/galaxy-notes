'use client';

import { FileText } from 'lucide-react';

interface RevertAsDraftDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RevertAsDraftDialog({
  open,
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
      <article className="relative z-10 w-96 rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <FileText className="h-5 w-5 text-amber-500" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Revert to draft?
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              This note is currently published. Changing it to a draft will
              unpublish it.
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
            className="cursor-pointer rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600/90"
          >
            Revert as Draft
          </button>
        </footer>
      </article>
    </div>
  );
}
