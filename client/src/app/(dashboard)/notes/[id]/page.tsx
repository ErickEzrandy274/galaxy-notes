import type { Metadata } from 'next';
import { NoteEditorPage } from '@/features/notes';

export const metadata: Metadata = { title: 'Edit Note' };

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoteEditorPage noteId={id} />;
}
