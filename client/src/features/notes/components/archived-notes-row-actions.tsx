'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, RotateCcw } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useUnarchiveNote } from '../hooks/use-archive-mutations';
import { ArchiveConfirmDialog } from './archive-confirm-dialog';

interface ArchivedNotesRowActionsProps {
  noteId: string;
  noteTitle: string;
}

export function ArchivedNotesRowActions({
  noteId,
  noteTitle,
}: ArchivedNotesRowActionsProps) {
  const router = useRouter();
  const [showUnarchive, setShowUnarchive] = useState(false);
  const unarchiveMutation = useUnarchiveNote();

  const itemClass =
    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted';

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[160px] rounded-lg border border-border bg-card p-1 shadow-lg"
          >
            <DropdownMenu.Item
              onSelect={() => router.push(`/archived/${noteId}`)}
              className={itemClass}
            >
              <Eye size={14} />
              View Note
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => setShowUnarchive(true)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-purple-500 outline-none hover:bg-purple-500/10"
            >
              <RotateCcw size={14} />
              Unarchive
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <ArchiveConfirmDialog
        open={showUnarchive}
        variant="unarchive"
        noteTitle={noteTitle}
        onConfirm={() => {
          unarchiveMutation.mutate(noteId, {
            onSettled: () => setShowUnarchive(false),
          });
        }}
        onCancel={() => setShowUnarchive(false)}
        isLoading={unarchiveMutation.isPending}
      />
    </>
  );
}
