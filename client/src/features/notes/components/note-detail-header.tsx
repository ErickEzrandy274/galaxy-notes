'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Share2, History, Archive, RotateCcw, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateNote, deleteNote } from '../api/notes-api';
import { useArchiveNote } from '../hooks/use-archive-mutations';
import { RevertAsDraftDialog } from './revert-as-draft-dialog';
import { ShareModal } from './share-modal';
import { TrashConfirmDialog } from '@/features/trash/components/trash-confirm-dialog';
import { ArchiveConfirmDialog } from './archive-confirm-dialog';

interface NoteDetailHeaderProps {
  noteId: string;
  title: string;
  status: string;
  version: number;
  isOwner: boolean;
  shareCount: number;
  onOpenHistory: () => void;
}

export function NoteDetailHeader({ noteId, title, status, version, isOwner, shareCount, onOpenHistory }: NoteDetailHeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isReverting, setIsReverting] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const archiveMutation = useArchiveNote();

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

      <div className="flex items-center gap-2" role="toolbar" aria-label="Note actions">
        <button
          type="button"
          onClick={() => router.push(`/notes/${noteId}`)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-lg"
            >
              {isOwner && (
                <DropdownMenu.Item
                  onClick={() => setShowShareModal(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
                >
                  <Share2 size={14} />
                  Share
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item
                onClick={onOpenHistory}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
              >
                <History size={14} />
                History
              </DropdownMenu.Item>
              {isOwner && status !== 'draft' && (
                <DropdownMenu.Item
                  onClick={() => setShowArchiveDialog(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
                >
                  <Archive size={14} />
                  Archive
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item
                onClick={handleRevert}
                disabled={isReverting}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted disabled:opacity-40"
              >
                {isReverting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Revert to Draft
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onClick={() => setShowTrashDialog(true)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
              >
                <Trash2 size={14} />
                Move to Trash
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
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
      <ArchiveConfirmDialog
        open={showArchiveDialog}
        variant="archive"
        noteTitle={title}
        shareCount={shareCount}
        onConfirm={() => {
          archiveMutation.mutate(noteId, {
            onSuccess: () => {
              toast.success('Note archived successfully');
              router.push('/archived');
            },
            onSettled: () => setShowArchiveDialog(false),
          });
        }}
        onCancel={() => setShowArchiveDialog(false)}
        isLoading={archiveMutation.isPending}
      />
    </header>
  );
}
