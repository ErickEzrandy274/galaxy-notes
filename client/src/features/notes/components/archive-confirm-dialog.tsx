'use client';

import { Archive, RotateCcw } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

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
  const { title, description, confirmLabel, loadingLabel, icon } =
    config[variant];

  const iconElement =
    icon === 'archive' ? (
      <Archive className="h-5 w-5 text-purple-500" />
    ) : (
      <RotateCcw className="h-5 w-5 text-purple-500" />
    );

  return (
    <ConfirmDialog
      open={open}
      icon={iconElement}
      iconBgClass="bg-purple-500/10"
      title={title}
      description={description(noteTitle)}
      confirmLabel={confirmLabel}
      loadingLabel={loadingLabel}
      confirmClassName="bg-purple-600 text-white hover:bg-purple-700"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {variant === 'archive' && !!shareCount && shareCount > 0 && (
        <p className="mt-2 text-left text-sm font-medium text-amber-500">
          This note is shared with {shareCount}{' '}
          {shareCount === 1 ? 'collaborator' : 'collaborators'}. They will lose
          access once it is archived.
        </p>
      )}
    </ConfirmDialog>
  );
}
