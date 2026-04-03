'use client';

import { useRouter } from 'next/navigation';
import { VersionPreviewPage } from '@/features/notes';

export function VersionPreviewClient({
  noteId,
  versionId,
}: {
  noteId: string;
  versionId: string;
}) {
  const router = useRouter();

  return (
    <VersionPreviewPage
      noteId={noteId}
      versionId={versionId}
      onBackToCurrent={() => router.push(`/notes/${noteId}/view`)}
    />
  );
}
