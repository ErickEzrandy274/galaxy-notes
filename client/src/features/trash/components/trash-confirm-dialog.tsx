'use client';

import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

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
      ? 'bg-destructive text-white hover:bg-destructive/90'
      : 'bg-blue-600 text-white hover:bg-blue-700';

  return (
    <ConfirmDialog
      open={open}
      icon={iconElement}
      iconBgClass={iconBg}
      title={title}
      description={description(noteTitle)}
      confirmLabel={confirmLabel}
      loadingLabel={loadingLabel}
      confirmClassName={btnClass}
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {variant === 'moveToTrash' && !!shareCount && shareCount > 0 && (
        <p className="mt-2 text-left text-sm font-medium text-amber-500">
          This note is shared with {shareCount}{' '}
          {shareCount === 1 ? 'collaborator' : 'collaborators'}. They will lose
          access once it is moved to trash.
        </p>
      )}
    </ConfirmDialog>
  );
}
