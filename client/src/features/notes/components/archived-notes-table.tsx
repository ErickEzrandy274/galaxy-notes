'use client';

import { ArchivedNotesTableRow } from './archived-notes-table-row';
import type { Note, ArchivedNoteColumnKey } from '../types';

interface ArchivedNotesTableProps {
  notes: Note[];
  columns: Record<ArchivedNoteColumnKey, boolean>;
}

export function ArchivedNotesTable({
  notes,
  columns,
}: ArchivedNotesTableProps) {
  return (
    <section className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Title
            </th>
            {columns.tags && (
              <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                Tags
              </th>
            )}
            {columns.createdAt && (
              <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                Created At
              </th>
            )}
            {columns.updatedAt && (
              <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                Last Modified
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <ArchivedNotesTableRow key={note.id} note={note} columns={columns} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
