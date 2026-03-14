import { ArchivedNoteDetailPage } from '@/features/notes';

export default async function ArchivedNoteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArchivedNoteDetailPage noteId={id} />;
}
