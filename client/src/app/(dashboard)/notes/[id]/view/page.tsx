import type { Metadata } from 'next';
import { NoteDetailPage } from '@/features/notes';

export const metadata: Metadata = { title: 'View Note' };

export default async function ViewNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoteDetailPage noteId={id} />;
}
