import type { Metadata } from 'next';
import { TrashPage } from '@/features/trash';

export const metadata: Metadata = { title: 'Trash' };

export default function Trash() {
  return <TrashPage />;
}
