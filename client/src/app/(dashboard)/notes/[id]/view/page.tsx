import { NoteDetailPage } from '@/features/notes';

export default async function ViewNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoteDetailPage noteId={id} />;
}
