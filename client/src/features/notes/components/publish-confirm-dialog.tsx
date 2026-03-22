'use client';

import { Upload } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface PublishConfirmDialogProps {
  open: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PublishConfirmDialog({
  open,
  isLoading,
  onConfirm,
  onCancel,
}: PublishConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      icon={<Upload className="h-5 w-5 text-green-500" />}
      iconBgClass="bg-green-500/10"
      title="Publish this note?"
      description="This note will be published and visible to others. You can revert it to a draft later."
      confirmLabel="Publish"
      loadingLabel="Publishing..."
      confirmClassName="bg-primary text-primary-foreground hover:bg-primary/90"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
