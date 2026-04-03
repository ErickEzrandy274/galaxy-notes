'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Archive } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { fetchNote } from '../api/notes-api';
import { ArchivedNoteDetailHeader } from './archived-note-detail-header';
import { NoteDetailContent } from './note-detail-content';
import dynamic from 'next/dynamic';
const VersionHistoryDrawer = dynamic(() => import('./version-history-drawer').then(m => m.VersionHistoryDrawer));
import { VersionPreviewPage } from './version-preview-page';

interface ArchivedNoteDetailPageProps {
  noteId: string;
}

export function ArchivedNoteDetailPage({
  noteId,
}: ArchivedNoteDetailPageProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);
  const { data: session } = useSession();

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', noteId],
    queryFn: ({ signal }) => fetchNote(noteId, signal),
  });

  const handleCloseHistory = () => {
    setHistoryOpen(false);
    setViewingVersionId(null);
  };

  if (isLoading || !note) {
    return (
      <output
        className="flex h-full items-center justify-center"
        aria-busy="true"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </output>
    );
  }

  return (
    <article className="relative flex h-full flex-col md:flex-row">
      <div className={`flex min-w-0 flex-1 flex-col ${viewingVersionId ? 'min-h-0' : ''}`}>
        {!viewingVersionId && (
          <>
            <ArchivedNoteDetailHeader
              noteId={noteId}
              title={note.title}
              onOpenHistory={() => setHistoryOpen(true)}
            />

            <aside className="flex items-center gap-2 border-b border-border bg-amber-500/5 px-4 py-2 text-sm font-semibold text-amber-600 md:px-6">
              <Archive className="h-4 w-4" />
              This note is archived and read-only. Unarchive to make edits.
            </aside>

            <NoteDetailContent note={note} />
          </>
        )}
        {viewingVersionId && (
          <VersionPreviewPage
            noteId={noteId}
            versionId={viewingVersionId}
            onBackToCurrent={() => setViewingVersionId(null)}
          />
        )}
      </div>

      <VersionHistoryDrawer
        noteId={noteId}
        currentUserId={session?.user?.id ?? ''}
        open={historyOpen}
        viewingVersionId={viewingVersionId}
        onSelectVersion={setViewingVersionId}
        onClose={handleCloseHistory}
      />
    </article>
  );
}
