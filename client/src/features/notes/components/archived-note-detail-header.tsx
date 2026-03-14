'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Share2, History, RotateCcw } from 'lucide-react';
import { useUnarchiveNote } from '../hooks/use-archive-mutations';
import { ArchiveConfirmDialog } from './archive-confirm-dialog';

interface ArchivedNoteDetailHeaderProps {
  noteId: string;
  title: string;
  onOpenHistory: () => void;
}

export function ArchivedNoteDetailHeader({
  noteId,
  title,
  onOpenHistory,
}: ArchivedNoteDetailHeaderProps) {
  const router = useRouter();
  const [showUnarchive, setShowUnarchive] = useState(false);
  const unarchiveMutation = useUnarchiveNote();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <Link
          href="/archived"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Archived
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">
          {title || 'Untitled'}
        </span>
      </nav>

      <span className="flex items-center gap-2">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/50 px-4 py-1.5 text-sm font-semibold text-primary-foreground opacity-50 cursor-not-allowed"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
        <button
          type="button"
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <History className="h-3.5 w-3.5" />
          History
        </button>
        <button
          type="button"
          onClick={() => setShowUnarchive(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Unarchive
        </button>
      </span>
      <ArchiveConfirmDialog
        open={showUnarchive}
        variant="unarchive"
        noteTitle={title}
        onConfirm={() => {
          unarchiveMutation.mutate(noteId, {
            onSuccess: () => {
              setShowUnarchive(false);
              router.push('/archived');
            },
            onSettled: () => setShowUnarchive(false),
          });
        }}
        onCancel={() => setShowUnarchive(false)}
        isLoading={unarchiveMutation.isPending}
      />
    </header>
  );
}
