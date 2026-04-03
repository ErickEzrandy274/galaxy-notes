import { Link2 } from 'lucide-react';
import type { ColumnKey, Note } from '../types';
import { StatusBadge } from './status-badge';
import { TagList } from './tag-badge';
import { NotesRowActions } from './notes-row-actions';
import { formatDate } from '../utils/format-date';

interface NotesTableRowProps {
  note: Note;
  columns: Record<ColumnKey, boolean>;
}

export function NotesTableRow({ note, columns }: NotesTableRowProps) {
  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/50">
      <td className="max-w-64 px-4 py-3">
        <strong
          className="block truncate text-sm font-medium text-foreground"
          title={note.title}
        >
          {note.title}
        </strong>
      </td>
      {columns.status && (
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
          <time>{formatDate(note.createdAt)}</time>
        </td>
      )}
      {columns.lastModified && (
        <td className="px-4 py-3 text-sm text-muted-foreground">
          <time>{formatDate(note.updatedAt)}</time>
        </td>
      )}
      {columns.shared && (
        <td className="px-4 py-3">
          {note._count.shares > 0 ? (
            <Link2 size={16} className="text-muted-foreground" />
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </td>
      )}
      <td className="px-4 py-3">
        <NotesRowActions noteId={note.id} noteTitle={note.title} noteStatus={note.status} shareCount={note._count.shares} />
      </td>
    </tr>
  );
}
