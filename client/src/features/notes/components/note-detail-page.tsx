'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { fetchNote } from '../api/notes-api';
import { NoteDetailHeader } from './note-detail-header';
import { NoteDetailContent } from './note-detail-content';
import { VersionHistoryDrawer } from './version-history-drawer';
import { VersionPreviewPage } from './version-preview-page';

interface NoteDetailPageProps {
  noteId: string;
}

export function NoteDetailPage({ noteId }: NoteDetailPageProps) {
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

  const handleBackToCurrent = () => {
    setViewingVersionId(null);
  };

  if (isLoading || !note) {
    return (
      <output className="flex h-full items-center justify-center" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </output>
    );
  }

  return (
    <article className="flex h-full">
      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!viewingVersionId && (
          <>
            <NoteDetailHeader
              noteId={noteId}
              title={note.title}
              status={note.status}
              version={note.version}
              isOwner={note.userId === session?.user?.id}
              shareCount={note.shares.length}
              onOpenHistory={() => setHistoryOpen(true)}
            />
            <NoteDetailContent note={note} />
          </>
        )}
        {viewingVersionId && (
          <VersionPreviewPage
            noteId={noteId}
            versionId={viewingVersionId}
            onBackToCurrent={handleBackToCurrent}
          />
        )}
      </div>

      {/* Version history drawer (side panel) */}
      {historyOpen && (
        <VersionHistoryDrawer
          noteId={noteId}
          currentUserId={session?.user?.id ?? ''}
          open={historyOpen}
          viewingVersionId={viewingVersionId}
          onSelectVersion={setViewingVersionId}
          onClose={handleCloseHistory}
        />
      )}
    </article>
  );
}
