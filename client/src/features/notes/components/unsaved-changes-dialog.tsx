'use client';

import { AlertTriangle } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface UnsavedChangesDialogProps {
  open: boolean;
  onLeave: () => void;
  onStay: () => void;
}

export function UnsavedChangesDialog({
  open,
  onLeave,
  onStay,
}: UnsavedChangesDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
      iconBgClass="bg-yellow-500/10"
      title="Unsaved changes"
      description="You have unsaved changes that will be lost if you leave this page."
      confirmLabel="Leave"
      cancelLabel="Stay"
      confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      onConfirm={onLeave}
      onCancel={onStay}
    />
  );
}
