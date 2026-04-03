import { StatusBadge } from '@/features/notes/components/status-badge';
import { TagList } from '@/features/notes/components/tag-badge';
import { formatDate } from '@/features/notes/utils/format-date';
import type { TrashColumnKey, TrashedNote } from '../types';
import { DaysLeftBadge } from './days-left-badge';
import { TrashRowActions } from './trash-row-actions';

interface TrashTableRowProps {
  note: TrashedNote;
  columns: Record<TrashColumnKey, boolean>;
  retentionDays: number;
}

export function TrashTableRow({ note, columns, retentionDays }: TrashTableRowProps) {
  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/50">
      <td className="max-w-64 px-4 py-3">
        <p
          className="block truncate text-sm font-medium text-foreground"
          title={note.title}
        >
          {note.title}
        </p>
      </td>
      {columns.originalStatus && (
        <td className="px-4 py-3">
          <StatusBadge status={note.status} />
        </td>
      )}
      {columns.tags && (
        <td className="px-4 py-3">
          <TagList tags={note.tags} />
        </td>
      )}
      {columns.createdAt && (
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {formatDate(note.createdAt)}
        </td>
      )}
      {columns.deletedOn && (
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {formatDate(note.deletedAt)}
        </td>
      )}
      {columns.daysLeft && (
        <td className="px-4 py-3">
          <DaysLeftBadge deletedAt={note.deletedAt} retentionDays={retentionDays} />
        </td>
      )}
      <td className="px-4 py-3">
        <TrashRowActions noteId={note.id} noteTitle={note.title} />
      </td>
    </tr>
  );
}
