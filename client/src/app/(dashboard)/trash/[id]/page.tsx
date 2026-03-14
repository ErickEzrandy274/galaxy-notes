import { TrashDetailPage } from '@/features/trash/components/trash-detail-page';

export default async function TrashedNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrashDetailPage noteId={id} />;
}
