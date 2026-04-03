'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, RotateCcw, MoreHorizontal, Pencil, Share2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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

      <div className="flex items-center gap-2" role="toolbar" aria-label="Note actions">
        <button
          type="button"
          onClick={() => setShowUnarchive(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Unarchive
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
              <DropdownMenu.Item
                disabled
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground opacity-50"
              >
                <Pencil size={14} />
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground opacity-50"
              >
                <Share2 size={14} />
                Share
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={onOpenHistory}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
              >
                <History size={14} />
                History
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
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
