'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Share2, History, Archive, RotateCcw, Trash2, MoreVertical } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import toast from 'react-hot-toast';
import { DetailPageHeader, Button } from '@/components/primitives';
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
    <>
      <DetailPageHeader
        backHref="/notes"
        backLabel="My Notes"
        title={title || 'Untitled'}
        actions={
          <>
            {/* Desktop: all buttons visible */}
            <span className="hidden items-center gap-2 md:flex">
              <Button variant="primary" size="sm" onClick={() => router.push(`/notes/${noteId}`)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              {isOwner && (
                <Button variant="outline-muted" size="sm" onClick={() => setShowShareModal(true)}>
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
              )}
              <Button variant="outline-muted" size="sm" onClick={onOpenHistory}>
                <History className="h-3.5 w-3.5" />
                History
              </Button>
              {isOwner && status !== 'draft' && (
                <Button variant="outline-muted" size="sm" onClick={() => setShowArchiveDialog(true)}>
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </Button>
              )}
              <Button variant="outline-muted" size="sm" loading={isReverting} onClick={handleRevert}>
                {!isReverting && <RotateCcw className="h-3.5 w-3.5" />}
                Revert to Draft
              </Button>
              <Button variant="destructive-outline" size="sm" onClick={() => setShowTrashDialog(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Move to Trash
              </Button>
            </span>

            {/* Mobile: Edit + three-dot menu */}
            <span className="flex w-full items-center justify-between md:hidden">
              <Button variant="primary" size="sm" onClick={() => router.push(`/notes/${noteId}`)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex cursor-pointer items-center rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" aria-label="More actions">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    className="z-50 min-w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
                  >
                    <menu className="p-1">
                      {isOwner && (
                        <DropdownMenu.Item
                          onSelect={() => setShowShareModal(true)}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-muted"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </DropdownMenu.Item>
                      )}
                      <DropdownMenu.Item
                        onSelect={onOpenHistory}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-muted"
                      >
                        <History className="h-4 w-4" />
                        History
                      </DropdownMenu.Item>
                      {isOwner && status !== 'draft' && (
                        <DropdownMenu.Item
                          onSelect={() => setShowArchiveDialog(true)}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-muted"
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </DropdownMenu.Item>
                      )}
                      <DropdownMenu.Item
                        onSelect={handleRevert}
                        disabled={isReverting}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-muted disabled:cursor-default disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Revert to Draft
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="mx-1 my-1 h-px bg-border" />
                      <DropdownMenu.Item
                        onSelect={() => setShowTrashDialog(true)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive outline-none hover:bg-muted"
                      >
                        <Trash2 className="h-4 w-4" />
                        Move to Trash
                      </DropdownMenu.Item>
                    </menu>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </span>
          </>
        }
      />
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
    </>
  );
}
