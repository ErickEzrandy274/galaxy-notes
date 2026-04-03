import type { ColumnKey, Note } from '../types';
import { NotesTableRow } from './notes-table-row';

interface NotesTableProps {
  notes: Note[];
  columns: Record<ColumnKey, boolean>;
}

export function NotesTable({ notes, columns }: NotesTableProps) {
  return (
    <section className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Title
            </th>
            {columns.status && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
            )}
            {columns.tags && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tags
              </th>
            )}
            {columns.createdAt && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Created At
              </th>
            )}
            {columns.lastModified && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Last Modified
              </th>
            )}
            {columns.shared && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Shared
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <NotesTableRow key={note.id} note={note} columns={columns} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
