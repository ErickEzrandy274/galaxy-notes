'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Pencil, LogOut } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
      <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Actions"
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            className="z-50 min-w-[160px] rounded-lg border border-border bg-card p-1 shadow-lg"
          >
            <DropdownMenu.Item
              onClick={() => router.push(`/shared/${note.id}`)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
            >
              <Eye size={14} />
              View Note
            </DropdownMenu.Item>

            {note.permission === 'WRITE' && (
              <DropdownMenu.Item
                onClick={() => router.push(`/notes/${note.id}`)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
              >
                <Pencil size={14} />
                Edit Note
              </DropdownMenu.Item>
            )}

            <DropdownMenu.Separator className="my-1 h-px bg-border" />

            <DropdownMenu.Item
              onClick={() => {
                setDropdownOpen(false);
                setLeaveDialogOpen(true);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
            >
              <LogOut size={14} />
              Leave
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

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
