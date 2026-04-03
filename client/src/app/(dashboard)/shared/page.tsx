import type { Metadata } from 'next';
import { SharedNotesPage } from '@/features/notes';

export const metadata: Metadata = { title: 'Shared with Me' };

export default function SharedPage() {
  return <SharedNotesPage />;
}
