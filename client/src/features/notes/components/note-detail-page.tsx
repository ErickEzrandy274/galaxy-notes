'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/primitives';
import { fetchNote } from '../api/notes-api';
import { useVersionDrawer } from '../hooks/use-version-drawer';
import { NoteDetailHeader } from './note-detail-header';
import { NoteDetailContent } from './note-detail-content';
import { VersionHistoryDrawer } from './version-history-drawer';
import { VersionPreviewPage } from './version-preview-page';

interface NoteDetailPageProps {
  noteId: string;
}

export function NoteDetailPage({ noteId }: NoteDetailPageProps) {
  const { data: session } = useSession();
  const {
    historyOpen,
    viewingVersionId,
    openHistory,
    handleSelectVersion,
    handleCloseHistory,
    handleBackToCurrent,
  } = useVersionDrawer();

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', noteId],
    queryFn: () => fetchNote(noteId),
  });

  if (isLoading || !note) {
    return (
      <output className="flex h-full items-center justify-center" aria-busy="true">
        <Spinner size="xl" />
      </output>
    );
  }

  return (
    <article className="relative flex h-full flex-col md:flex-row">
      {/* Main content area */}
      <div className={`flex min-w-0 flex-1 flex-col ${viewingVersionId ? 'min-h-0' : ''}`}>
        {!viewingVersionId && (
          <>
            <NoteDetailHeader
              noteId={noteId}
              title={note.title}
              status={note.status}
              version={note.version}
              isOwner={note.userId === session?.user?.id}
              shareCount={note.shares.length}
              onOpenHistory={openHistory}
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
          onSelectVersion={handleSelectVersion}
          onClose={handleCloseHistory}
        />
      )}
    </article>
  );
}
