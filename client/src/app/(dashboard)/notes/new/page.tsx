import type { Metadata } from 'next';
import { NoteEditorPage } from '@/features/notes';

export const metadata: Metadata = { title: 'New Note' };

export default function NewNotePage() {
  return <NoteEditorPage />;
}
