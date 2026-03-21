'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Share2, History, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
