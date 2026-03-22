'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { Spinner } from '@/components/primitives';
import { useSession } from 'next-auth/react';
import { fetchNote } from '../api/notes-api';
import { useVersionDrawer } from '../hooks/use-version-drawer';
import { SharedNoteDetailHeader } from './shared-note-detail-header';
import { NoteDetailContent } from './note-detail-content';
import { VersionHistoryDrawer } from './version-history-drawer';
import { VersionPreviewPage } from './version-preview-page';

interface SharedNoteDetailPageProps {
  noteId: string;
}

export function SharedNoteDetailPage({ noteId }: SharedNoteDetailPageProps) {
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
      <output
        className="flex h-full items-center justify-center"
        aria-busy="true"
      >
        <Spinner size="xl" />
      </output>
    );
  }

  const myShare = note.shares.find((s) => s.userId === session?.user?.id);
  const permission = myShare?.permission ?? 'READ';

  return (
    <article className="relative flex h-full flex-col md:flex-row">
      <div className={`flex min-w-0 flex-1 flex-col ${viewingVersionId ? 'min-h-0' : ''}`}>
        {!viewingVersionId && (
          <>
            <SharedNoteDetailHeader
              noteId={noteId}
              title={note.title}
              permission={permission}
              onOpenHistory={openHistory}
            />

            {permission === 'READ' && (
              <aside className="flex items-center gap-2 border-b border-border bg-blue-500/5 px-4 py-2 text-sm font-semibold text-blue-600 md:px-6">
                <ShieldAlert className="h-4 w-4" />
                You have read-only access to this note.
              </aside>
            )}

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
