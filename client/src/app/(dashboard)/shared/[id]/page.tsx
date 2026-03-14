import { SharedNoteDetailPage } from '@/features/notes';

export default async function SharedNoteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SharedNoteDetailPage noteId={id} />;
}
