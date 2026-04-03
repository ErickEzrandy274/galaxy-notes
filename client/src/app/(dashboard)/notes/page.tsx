import type { Metadata } from 'next';
import { NotesPage } from '@/features/notes';

export const metadata: Metadata = { title: 'My Notes' };

export default function MyNotesPage() {
  return <NotesPage />;
}
