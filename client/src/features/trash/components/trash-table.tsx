import type { TrashColumnKey, TrashedNote } from '../types';
import { TrashTableRow } from './trash-table-row';

interface TrashTableProps {
  notes: TrashedNote[];
  columns: Record<TrashColumnKey, boolean>;
  retentionDays: number;
}

export function TrashTable({ notes, columns, retentionDays }: TrashTableProps) {
  return (
    <section className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Title
            </th>
            {columns.originalStatus && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Original Status
              </th>
            )}
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
            {columns.deletedOn && (
              <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                Deleted On
              </th>
            )}
            {columns.daysLeft && (
              <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                Days Left
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <TrashTableRow
              key={note.id}
              note={note}
              columns={columns}
              retentionDays={retentionDays}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}
