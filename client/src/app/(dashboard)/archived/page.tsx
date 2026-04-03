import type { Metadata } from 'next';
import { ArchivedNotesPage } from '@/features/notes';

export const metadata: Metadata = { title: 'Archived' };

export default function ArchivedPage() {
  return <ArchivedNotesPage />;
}
