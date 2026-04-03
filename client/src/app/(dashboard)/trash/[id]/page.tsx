import type { Metadata } from 'next';
import { TrashDetailPage } from '@/features/trash/components/trash-detail-page';

export const metadata: Metadata = { title: 'Trashed Note' };

export default async function TrashedNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrashDetailPage noteId={id} />;
}
