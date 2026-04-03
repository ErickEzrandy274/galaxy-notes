'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, History } from 'lucide-react';
import { PermissionBadge } from './permission-badge';

interface SharedNoteDetailHeaderProps {
  noteId: string;
  title: string;
  permission: 'READ' | 'WRITE';
  onOpenHistory: () => void;
}

export function SharedNoteDetailHeader({
  noteId,
  title,
  permission,
  onOpenHistory,
}: SharedNoteDetailHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <Link
          href="/shared"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Shared with Me
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">
          {title || 'Untitled'}
        </span>
        <PermissionBadge permission={permission} />
      </nav>

      <div className="flex items-center gap-2" role="toolbar" aria-label="Note actions">
        {permission === 'WRITE' && (
          <button
            type="button"
            onClick={() => router.push(`/notes/${noteId}`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
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
      </div>
    </header>
  );
}
