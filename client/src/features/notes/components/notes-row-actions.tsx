'use client';

import { Eye, MoreHorizontal, Pencil, Share2, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteNote } from '../api/notes-api';

interface NotesRowActionsProps {
  noteId: string;
  noteStatus: string;
}

export function NotesRowActions({ noteId, noteStatus }: NotesRowActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note moved to trash');
    },
  });

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {noteStatus === 'published' && (
            <DropdownMenu.Item
              onClick={() => router.push(`/notes/${noteId}/view`)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
            >
              <Eye size={14} />
              View Note
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            onClick={() => router.push(`/notes/${noteId}`)}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
          >
            <Pencil size={14} />
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
          >
            <Share2 size={14} />
            Share
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onClick={() => deleteMutation.mutate()}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
          >
            <Trash2 size={14} />
            Move to Trash
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
