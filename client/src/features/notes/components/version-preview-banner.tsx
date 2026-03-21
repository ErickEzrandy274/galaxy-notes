'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/primitives';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { restoreVersion } from '../api/notes-api';
import type { NoteStatus } from '../types';

interface VersionPreviewBannerProps {
  noteId: string;
  versionId: string;
  versionNumber: number;
  createdAt: string;
  changedByName: string;
  noteStatus: NoteStatus;
  onBackToCurrent: () => void;
}

export function VersionPreviewBanner({
  noteId,
  versionId,
  versionNumber,
  createdAt,
  changedByName,
  noteStatus,
  onBackToCurrent,
}: VersionPreviewBannerProps) {
  const queryClient = useQueryClient();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const restoreMutation = useMutation({
    mutationFn: () => restoreVersion(noteId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      queryClient.invalidateQueries({ queryKey: ['note-versions', noteId] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Version restored successfully');
      onBackToCurrent();
    },
    onError: () => {
      toast.error('Failed to restore version');
    },
  });

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(createdAt));

  const isArchived = noteStatus === 'archived';

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-amber-500/20 bg-[#F59E0B]/12 px-6 py-3">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <Clock className="h-4 w-4 text-[#F59E0B]" />
          <span>
            You are viewing Version {versionNumber} &mdash; saved on {formattedDate} by {changedByName}
          </span>
        </p>
        <nav className="flex items-center gap-2">
          {!isArchived && (
            <button
              type="button"
              onClick={() => setShowRestoreDialog(true)}
              disabled={restoreMutation.isPending}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#F59E0B] px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {restoreMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Restore This
            </button>
          )}
          <Button variant="outline-muted" size="sm" onClick={onBackToCurrent}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Current
          </Button>
        </nav>
      </header>

      <ConfirmDialog
        open={showRestoreDialog}
        icon={<RotateCcw className="h-5 w-5 text-purple-600" />}
        iconBgClass="bg-purple-500/10"
        title="Restore this version?"
        description="The current note content will be saved as a new version before restoring. You won't lose any data."
        confirmLabel="Restore Version"
        confirmClassName="bg-purple-600 text-white hover:bg-purple-700"
        onConfirm={() => {
          setShowRestoreDialog(false);
          restoreMutation.mutate();
        }}
        onCancel={() => setShowRestoreDialog(false)}
      />
    </>
  );
}
