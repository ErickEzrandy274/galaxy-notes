'use client';

import { useState } from 'react';
import { Archive, Eye, Pencil, Share2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
} from '@/components/primitives';
import { deleteNote } from '../api/notes-api';
import { useArchiveNote } from '../hooks/use-archive-mutations';
import { ShareModal } from './share-modal';
import { ArchiveConfirmDialog } from './archive-confirm-dialog';
import { TrashConfirmDialog } from '@/features/trash/components/trash-confirm-dialog';

interface NotesRowActionsProps {
  noteId: string;
  noteTitle: string;
  noteStatus: string;
  shareCount: number;
}

export function NotesRowActions({ noteId, noteTitle, noteStatus, shareCount }: NotesRowActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const archiveMutation = useArchiveNote();

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note moved to trash');
    },
  });

  return (
    <>
      <ActionMenu>
        <ActionMenuTrigger />
        <ActionMenuContent>
          {(noteStatus === 'published' || noteStatus === 'shared') && (
            <ActionMenuItem
              icon={Eye}
              label="View Note"
              onClick={() => router.push(`/notes/${noteId}/view`)}
            />
          )}
          <ActionMenuItem
            icon={Pencil}
            label="Edit"
            onClick={() => router.push(`/notes/${noteId}`)}
          />
          {noteStatus !== 'draft' && (
            <ActionMenuItem
              icon={Share2}
              label="Share"
              onClick={() => setShowShareModal(true)}
            />
          )}
          {noteStatus !== 'draft' && (
            <ActionMenuItem
              icon={Archive}
              label="Archive"
              onClick={() => setShowArchiveDialog(true)}
            />
          )}
          <ActionMenuSeparator />
          <ActionMenuItem
            icon={Trash2}
            label="Move to Trash"
            destructive
            onClick={() => setShowTrashDialog(true)}
          />
        </ActionMenuContent>
      </ActionMenu>
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        noteId={noteId}
        noteTitle={noteTitle}
      />
      <ArchiveConfirmDialog
        open={showArchiveDialog}
        variant="archive"
        noteTitle={noteTitle}
        shareCount={shareCount}
        onConfirm={() => {
          archiveMutation.mutate(noteId, {
            onSuccess: () => {
              toast.success('Note archived successfully');
            },
            onSettled: () => setShowArchiveDialog(false),
          });
        }}
        onCancel={() => setShowArchiveDialog(false)}
        isLoading={archiveMutation.isPending}
      />
      <TrashConfirmDialog
        open={showTrashDialog}
        variant="moveToTrash"
        noteTitle={noteTitle}
        shareCount={shareCount}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSettled: () => setShowTrashDialog(false),
          });
        }}
        onCancel={() => setShowTrashDialog(false)}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
