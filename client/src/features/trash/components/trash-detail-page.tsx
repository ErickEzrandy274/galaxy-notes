'use client';

import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/primitives';
import { fetchTrashedNote } from '../api/trash-api';
import { TrashDetailHeader } from './trash-detail-header';
import { NoteDetailContent } from '@/features/notes/components/note-detail-content';

interface TrashDetailPageProps {
  noteId: string;
}

export function TrashDetailPage({ noteId }: TrashDetailPageProps) {
  const { data: note, isLoading } = useQuery({
    queryKey: ['note', 'trash', noteId],
    queryFn: () => fetchTrashedNote(noteId),
  });

  if (isLoading || !note) {
    return (
      <output className="flex h-full items-center justify-center" aria-busy="true">
        <Spinner size="xl" />
      </output>
    );
  }

  return (
    <article className="flex h-full flex-col">
      <TrashDetailHeader noteId={noteId} noteTitle={note.title} />
      <NoteDetailContent note={note} />
    </article>
  );
}
