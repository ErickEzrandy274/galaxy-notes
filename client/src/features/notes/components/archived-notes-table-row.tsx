import { TagList } from './tag-badge';
import { formatDate } from '../utils/format-date';
import { ArchivedNotesRowActions } from './archived-notes-row-actions';
import type { Note, ArchivedNoteColumnKey } from '../types';

interface ArchivedNotesTableRowProps {
  note: Note;
  columns: Record<ArchivedNoteColumnKey, boolean>;
}

export function ArchivedNotesTableRow({
  note,
  columns,
}: ArchivedNotesTableRowProps) {
  return (
    <tr className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/50">
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {note.title || 'Untitled'}
      </td>
      {columns.tags && (
        <td className="hidden px-4 py-3 md:table-cell">
          <TagList tags={note.tags} />
        </td>
      )}
      {columns.createdAt && (
        <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
          <time>{formatDate(note.createdAt)}</time>
        </td>
      )}
      {columns.updatedAt && (
        <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
          <time>{formatDate(note.updatedAt)}</time>
        </td>
      )}
      <td className="px-4 py-3">
        <ArchivedNotesRowActions noteId={note.id} noteTitle={note.title} />
      </td>
    </tr>
  );
}
