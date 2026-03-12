'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { fetchNote } from '../api/notes-api';
import { NoteDetailHeader } from './note-detail-header';
import { NoteDetailContent } from './note-detail-content';

interface NoteDetailPageProps {
  noteId: string;
}

export function NoteDetailPage({ noteId }: NoteDetailPageProps) {
  const { data: note, isLoading } = useQuery({
    queryKey: ['note', noteId],
    queryFn: () => fetchNote(noteId),
  });

  if (isLoading || !note) {
    return (
      <output className="flex h-full items-center justify-center" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </output>
    );
  }

  return (
    <article className="flex h-full flex-col">
      <NoteDetailHeader noteId={noteId} title={note.title} version={note.version} />
      <NoteDetailContent note={note} />
    </article>
  );
}
