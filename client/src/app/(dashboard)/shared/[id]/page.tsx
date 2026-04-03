import type { Metadata } from 'next';
import { SharedNoteDetailPage } from '@/features/notes';

export const metadata: Metadata = { title: 'Shared Note' };

export default async function SharedNoteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SharedNoteDetailPage noteId={id} />;
}
