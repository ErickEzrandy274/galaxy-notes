'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
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
      <header className="sticky top-0 z-10 flex flex-col items-center gap-2 border-b border-amber-500/20 bg-[#F59E0B]/12 px-4 py-3 md:flex-row md:justify-between md:px-6">
        <p className="flex items-center gap-2 text-center text-sm text-foreground md:text-left">
          <Clock className="h-4 w-4 shrink-0 text-[#F59E0B]" />
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
          <button
            type="button"
            onClick={onBackToCurrent}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Current
          </button>
        </nav>
      </header>

      {/* Restore confirmation dialog */}
      {showRestoreDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <article className="relative z-10 w-96 rounded-lg border border-border bg-card p-6 shadow-xl">
            <header className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                <RotateCcw className="h-5 w-5 text-purple-600" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Restore this version?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The current note content will be saved as a new version before
                  restoring. You won&apos;t lose any data.
                </p>
              </div>
            </header>
            <footer className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRestoreDialog(false)}
                className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRestoreDialog(false);
                  restoreMutation.mutate();
                }}
                className="cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Restore Version
              </button>
            </footer>
          </article>
        </div>
      )}
    </>
  );
}
