'use client';

import type { SharedNote, SharedNoteColumnKey } from '../types';
import { SharedNotesTableRow } from './shared-notes-table-row';

interface SharedNotesTableProps {
  notes: SharedNote[];
  columns: Record<SharedNoteColumnKey, boolean>;
}

export function SharedNotesTable({ notes, columns }: SharedNotesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
              Title
            </th>
            {columns.owner && (
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                Owner
              </th>
            )}
            {columns.permission && (
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                Permission
              </th>
            )}
            {columns.tags && (
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                Tags
              </th>
            )}
            {columns.createdAt && (
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                Created At
              </th>
            )}
            {columns.sharedOn && (
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                Shared On
              </th>
            )}
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <SharedNotesTableRow key={note.id} note={note} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
