'use client';

import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

type Variant = 'permanentDelete' | 'emptyTrash' | 'moveToTrash' | 'restore';

interface TrashConfirmDialogProps {
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
    style: 'destructive' | 'primary';
    icon: 'alert' | 'trash' | 'restore';
  }
> = {
  permanentDelete: {
    title: 'Permanently delete this note?',
    description: (noteTitle?: string) =>
      `"${noteTitle || 'Untitled'}" will be permanently deleted. This action cannot be undone.`,
    confirmLabel: 'Delete Permanently',
    loadingLabel: 'Deleting...',
    style: 'destructive',
    icon: 'alert',
  },
  emptyTrash: {
    title: 'Empty trash?',
    description: () =>
      'All notes in trash will be permanently deleted. This action cannot be undone.',
    confirmLabel: 'Empty Trash',
    loadingLabel: 'Deleting...',
    style: 'destructive',
    icon: 'trash',
  },
  moveToTrash: {
    title: 'Move to trash?',
    description: (noteTitle?: string) =>
      `"${noteTitle || 'Untitled'}" will be moved to trash. You can restore it later.`,
    confirmLabel: 'Move to Trash',
    loadingLabel: 'Moving...',
    style: 'destructive',
    icon: 'trash',
  },
  restore: {
    title: 'Restore this note?',
    description: (noteTitle?: string) =>
      `"${noteTitle || 'Untitled'}" will be restored as a draft.`,
    confirmLabel: 'Restore',
    loadingLabel: 'Restoring...',
    style: 'primary',
    icon: 'restore',
  },
};

export function TrashConfirmDialog({
  open,
  variant,
  noteTitle,
  shareCount,
  onConfirm,
  onCancel,
  isLoading,
}: TrashConfirmDialogProps) {
  if (!open) return null;

  const { title, description, confirmLabel, loadingLabel, style, icon } =
    config[variant];

  const iconElement = {
    alert: <AlertTriangle className="h-5 w-5 text-destructive" />,
    trash: <Trash2 className="h-5 w-5 text-destructive" />,
    restore: <RotateCcw className="h-5 w-5 text-blue-500" />,
  }[icon];

  const iconBg =
    style === 'destructive' ? 'bg-destructive/10' : 'bg-blue-500/10';
  const btnClass =
    style === 'destructive'
      ? 'bg-destructive hover:bg-destructive/90'
      : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <article className="relative z-10 w-96 rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
          >
            {iconElement}
          </span>
          <div>
            <h2 className="text-left text-sm font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-left text-sm text-muted-foreground">
              {description(noteTitle)}
            </p>
            {variant === 'moveToTrash' && !!shareCount && shareCount > 0 && (
              <p className="mt-2 text-left text-sm font-medium text-amber-500">
                This note is shared with {shareCount} {shareCount === 1 ? 'collaborator' : 'collaborators'}. They will lose access once it is moved to trash.
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
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${btnClass}`}
          >
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </footer>
      </article>
    </div>
  );
}
