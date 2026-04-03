import type { Metadata } from 'next';
import { VersionPreviewClient } from './version-preview-client';

export const metadata: Metadata = { title: 'Version Preview' };

export default async function ViewVersionPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = await params;
  return <VersionPreviewClient noteId={id} versionId={versionId} />;
}
