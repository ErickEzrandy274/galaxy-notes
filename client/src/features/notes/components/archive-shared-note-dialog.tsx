'use client';

import { AlertTriangle } from 'lucide-react';

interface ArchiveSharedNoteDialogProps {
  open: boolean;
  noteTitle: string;
  sharedUsers: Array<{ firstName: string | null; lastName: string | null; email: string }>;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ArchiveSharedNoteDialog({
  open,
  noteTitle,
  sharedUsers,
  onConfirm,
  onCancel,
}: ArchiveSharedNoteDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <article className="relative z-10 w-96 rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Archive shared note?</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              &quot;{noteTitle}&quot; is shared with {sharedUsers.length} user{sharedUsers.length > 1 ? 's' : ''}. Archiving will revoke their access and notify them.
            </p>
            {sharedUsers.length > 0 && (
              <ul className="mt-2 space-y-1">
                {sharedUsers.map((user) => (
                  <li key={user.email} className="text-xs text-muted-foreground">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
                  </li>
                ))}
              </ul>
            )}
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
            Archive Anyway
          </button>
        </footer>
      </article>
    </div>
  );
}
