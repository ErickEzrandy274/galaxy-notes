'use client';

import { Archive, RotateCcw } from 'lucide-react';

type Variant = 'archive' | 'unarchive';

interface ArchiveConfirmDialogProps {
  open: boolean;
  variant: Variant;
  noteTitle?: string;
  shareCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const config: Record<
  Variant,
  {
    title: string;
    description: (noteTitle?: string) => string;
    confirmLabel: string;
    loadingLabel: string;
    icon: 'archive' | 'unarchive';
  }
> = {
  archive: {
    title: 'Archive this note?',
    description: (noteTitle?: string) =>
      `"${noteTitle || 'Untitled'}" will be archived and become read-only. You can unarchive it at any time to make edits.`,
    confirmLabel: 'Archive',
    loadingLabel: 'Archiving...',
    icon: 'archive',
  },
  unarchive: {
    title: 'Unarchive this note?',
    description: (noteTitle?: string) =>
      `"${noteTitle || 'Untitled'}" will be restored to its previous status and will be editable again. Shared access will not be automatically restored.`,
    confirmLabel: 'Unarchive',
    loadingLabel: 'Unarchiving...',
    icon: 'unarchive',
  },
};

export function ArchiveConfirmDialog({
  open,
  variant,
  noteTitle,
  shareCount,
  onConfirm,
  onCancel,
  isLoading,
}: ArchiveConfirmDialogProps) {
  if (!open) return null;

  const { title, description, confirmLabel, loadingLabel, icon } =
    config[variant];

  const iconElement =
    icon === 'archive' ? (
      <Archive className="h-5 w-5 text-purple-500" />
    ) : (
      <RotateCcw className="h-5 w-5 text-purple-500" />
    );

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
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
              {iconElement}
            </span>
            <h4 className="text-left text-lg font-semibold text-foreground">
              {title}
            </h4>
          </div>
          <div>
            <p className="mt-1 text-left text-sm text-muted-foreground">
              {description(noteTitle)}
            </p>
            {variant === 'archive' && !!shareCount && shareCount > 0 && (
              <p className="mt-2 text-left text-sm font-medium text-amber-500">
                This note is shared with {shareCount}{' '}
                {shareCount === 1 ? 'collaborator' : 'collaborators'}. They will
                lose access once it is archived.
              </p>
            )}
          </div>
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
            className="cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </footer>
      </article>
    </div>
  );
}
