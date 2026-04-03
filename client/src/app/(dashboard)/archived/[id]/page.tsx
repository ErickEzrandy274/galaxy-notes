import type { Metadata } from 'next';
import { ArchivedNoteDetailPage } from '@/features/notes';

export const metadata: Metadata = { title: 'Archived Note' };

export default async function ArchivedNoteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArchivedNoteDetailPage noteId={id} />;
}
