'use client';

import { AlertTriangle } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface ArchiveSharedNoteDialogProps {
  open: boolean;
  noteTitle: string;
  sharedUsers: Array<{
    firstName: string | null;
    lastName: string | null;
    email: string;
  }>;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ArchiveSharedNoteDialog({
  open,
  noteTitle,
  sharedUsers,
  isLoading,
  onConfirm,
  onCancel,
}: ArchiveSharedNoteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
      iconBgClass="bg-amber-500/10"
      title="Archive shared note?"
      description={
        <>
          &quot;{noteTitle}&quot; is shared with {sharedUsers.length} user
          {sharedUsers.length > 1 ? 's' : ''}. Archiving will revoke their
          access and notify them.
        </>
      }
      confirmLabel="Archive Anyway"
      loadingLabel="Archiving..."
      confirmClassName="bg-amber-600 text-white hover:bg-amber-600/90"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {sharedUsers.length > 0 && (
        <ul className="mt-2 space-y-1">
          {sharedUsers.map((user) => (
            <li key={user.email} className="text-xs text-muted-foreground">
              {[user.firstName, user.lastName].filter(Boolean).join(' ') ||
                user.email}
            </li>
          ))}
        </ul>
      )}
    </ConfirmDialog>
  );
}
