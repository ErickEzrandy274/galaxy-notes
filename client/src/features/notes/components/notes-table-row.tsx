import Link from 'next/link';
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
      <td className="px-4 py-3">
        <Link
          href={`/notes/${note.id}`}
          className="cursor-pointer text-sm font-medium text-foreground hover:text-primary"
        >
          {note.title}
        </Link>
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
          {formatDate(note.createdAt)}
        </td>
      )}
      {columns.lastModified && (
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {formatDate(note.updatedAt)}
        </td>
      )}
      {columns.shared && (
        <td className="px-4 py-3">
          {note._count.shares > 0 && (
            <Link2 size={16} className="text-muted-foreground" />
          )}
        </td>
      )}
      <td className="px-4 py-3">
        <NotesRowActions noteId={note.id} />
      </td>
    </tr>
  );
}
