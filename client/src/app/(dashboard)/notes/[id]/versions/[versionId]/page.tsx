'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { VersionPreviewPage } from '@/features/notes';

export default function ViewVersionPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = use(params);
  const router = useRouter();

  return (
    <VersionPreviewPage
      noteId={id}
      versionId={versionId}
      onBackToCurrent={() => router.push(`/notes/${id}/view`)}
    />
  );
}
