'use client';

import { FileText } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

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
  return (
    <ConfirmDialog
      open={open}
      icon={<FileText className="h-5 w-5 text-amber-500" />}
      iconBgClass="bg-amber-500/10"
      title="Revert to draft?"
      description="This note is currently published. Changing it to a draft will unpublish it."
      confirmLabel="Revert as Draft"
      loadingLabel="Reverting..."
      confirmClassName="bg-amber-600 text-white hover:bg-amber-600/90"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
