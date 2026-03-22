'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil, LogOut } from 'lucide-react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
} from '@/components/primitives';
import { removeShare } from '../api/shares-api';
import { LeaveSharedNoteDialog } from './leave-shared-note-dialog';
import type { SharedNote } from '../types';

interface SharedNotesRowActionsProps {
  note: SharedNote;
  shareId?: string;
}

function ownerName(owner: SharedNote['owner']): string {
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
  return name || owner.email;
}

export function SharedNotesRowActions({
  note,
  shareId,
}: SharedNotesRowActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const leaveMutation = useMutation({
    mutationFn: () => {
      if (!shareId) throw new Error('Share ID not found');
      return removeShare(shareId);
    },
    onSuccess: () => {
      setLeaveDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['shared-notes'] });
      toast.success('Left shared note');
    },
  });

  return (
    <>
      <DropdownMenuPrimitive.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <ActionMenuTrigger />
        <ActionMenuContent>
          <ActionMenuItem
            icon={Eye}
            label="View Note"
            onClick={() => router.push(`/shared/${note.id}`)}
          />
          {note.permission === 'WRITE' && (
            <ActionMenuItem
              icon={Pencil}
              label="Edit Note"
              onClick={() => router.push(`/notes/${note.id}`)}
            />
          )}
          <ActionMenuSeparator />
          <ActionMenuItem
            icon={LogOut}
            label="Leave"
            destructive
            onClick={() => {
              setDropdownOpen(false);
              setLeaveDialogOpen(true);
            }}
          />
        </ActionMenuContent>
      </DropdownMenuPrimitive.Root>

      <LeaveSharedNoteDialog
        open={leaveDialogOpen}
        noteTitle={note.title || 'Untitled'}
        ownerName={ownerName(note.owner)}
        isLoading={leaveMutation.isPending}
        onConfirm={() => leaveMutation.mutate()}
        onCancel={() => setLeaveDialogOpen(false)}
      />
    </>
  );
}
