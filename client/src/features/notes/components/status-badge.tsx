import type { NoteStatus } from '../types';

const statusStyles: Record<NoteStatus, string> = {
  published: 'bg-green-500/20 text-green-600 dark:text-green-400',
  draft: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  archived: 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400',
  shared: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
};

export function StatusBadge({ status }: { status: NoteStatus }) {
  return (
    <mark
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status}
    </mark>
  );
}
