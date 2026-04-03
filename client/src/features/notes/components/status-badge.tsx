import type { NoteStatus } from '../types';

const statusStyles: Record<NoteStatus, string> = {
  published: 'bg-green-500/20 text-green-400',
  draft: 'bg-amber-500/20 text-amber-400',
  archived: 'bg-zinc-500/20 text-zinc-400',
  shared: 'bg-blue-500/20 text-blue-400',
};

export function StatusBadge({ status }: { status: NoteStatus }) {
  return (
    <mark
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </mark>
  );
}
