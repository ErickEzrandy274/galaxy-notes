'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { fetchNote } from '../api/notes-api';
import { SharedNoteDetailHeader } from './shared-note-detail-header';
import { NoteDetailContent } from './note-detail-content';
import { VersionHistoryDrawer } from './version-history-drawer';
import { VersionPreviewPage } from './version-preview-page';

interface SharedNoteDetailPageProps {
  noteId: string;
}

export function SharedNoteDetailPage({ noteId }: SharedNoteDetailPageProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);
  const { data: session } = useSession();

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', noteId],
    queryFn: () => fetchNote(noteId),
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
      <output
        className="flex h-full items-center justify-center"
        aria-busy="true"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </output>
    );
  }

  const myShare = note.shares.find((s) => s.userId === session?.user?.id);
  const permission = myShare?.permission ?? 'READ';

  return (
    <article className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {!viewingVersionId && (
          <>
            <SharedNoteDetailHeader
              noteId={noteId}
              title={note.title}
              permission={permission}
              onOpenHistory={() => setHistoryOpen(true)}
            />

            {permission === 'READ' && (
              <aside className="flex items-center gap-2 border-b border-border bg-blue-500/5 px-6 py-2 text-sm text-blue-600">
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
          onSelectVersion={setViewingVersionId}
          onClose={handleCloseHistory}
        />
      )}
    </article>
  );
}
