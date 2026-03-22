'use client';

import { LogOut } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface LeaveSharedNoteDialogProps {
  open: boolean;
  noteTitle: string;
  ownerName: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LeaveSharedNoteDialog({
  open,
  noteTitle,
  ownerName,
  isLoading,
  onConfirm,
  onCancel,
}: LeaveSharedNoteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      icon={<LogOut className="h-5 w-5 text-destructive" />}
      iconBgClass="bg-destructive/10"
      title="Leave shared note?"
      description={
        <>
          You will lose access to &quot;{noteTitle}&quot; shared by {ownerName}.
          This action cannot be undone.
        </>
      }
      confirmLabel="Leave"
      loadingLabel="Leaving..."
      confirmClassName="bg-destructive text-white hover:bg-destructive/90"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
