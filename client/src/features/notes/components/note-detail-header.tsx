'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Share2, History, Archive, RotateCcw, Trash2, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateNote, deleteNote } from '../api/notes-api';
import { RevertAsDraftDialog } from './revert-as-draft-dialog';
import { ShareModal } from './share-modal';
import { TrashConfirmDialog } from '@/features/trash/components/trash-confirm-dialog';

interface NoteDetailHeaderProps {
  noteId: string;
  title: string;
  version: number;
  isOwner: boolean;
  shareCount: number;
  onOpenHistory: () => void;
}

export function NoteDetailHeader({ noteId, title, version, isOwner, shareCount, onOpenHistory }: NoteDetailHeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isReverting, setIsReverting] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTrashDialog, setShowTrashDialog] = useState(false);

  const trashMutation = useMutation({
    mutationFn: () => deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note moved to trash');
      router.push('/notes');
    },
    onError: () => {
      toast.error('Failed to move note to trash');
    },
  });

  const revertMutation = useMutation({
    mutationFn: () => updateNote(noteId, { status: 'draft', version }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note reverted to draft');
      router.push('/notes');
    },
    onError: () => {
      toast.error('Failed to revert note');
      setIsReverting(false);
    },
  });

  const handleRevert = () => {
    setShowRevertDialog(true);
  };

  const confirmRevert = () => {
    setShowRevertDialog(false);
    setIsReverting(true);
    revertMutation.mutate();
  };

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <Link
          href="/notes"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          My Notes
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">
          {title || 'Untitled'}
        </span>
      </nav>

      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(`/notes/${noteId}`)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        )}
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
          onClick={() => toast('Coming soon')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <Archive className="h-3.5 w-3.5" />
          Archive
        </button>
        <button
          type="button"
          onClick={handleRevert}
          disabled={isReverting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 cursor-pointer"
        >
          {isReverting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          Revert to Draft
        </button>
        <button
          type="button"
          onClick={() => setShowTrashDialog(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Move to Trash
        </button>
      </span>
      <RevertAsDraftDialog
        open={showRevertDialog}
        onConfirm={confirmRevert}
        onCancel={() => setShowRevertDialog(false)}
      />
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        noteId={noteId}
        noteTitle={title}
      />
      <TrashConfirmDialog
        open={showTrashDialog}
        variant="moveToTrash"
        noteTitle={title}
        shareCount={shareCount}
        onConfirm={() => {
          trashMutation.mutate(undefined, {
            onSettled: () => setShowTrashDialog(false),
          });
        }}
        onCancel={() => setShowTrashDialog(false)}
        isLoading={trashMutation.isPending}
      />
    </header>
  );
}
