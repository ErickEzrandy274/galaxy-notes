import { NoteEditorPage } from '@/features/notes';

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoteEditorPage noteId={id} />;
}
