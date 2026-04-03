'use client';

import type { SharedNote, SharedNoteColumnKey } from '../types';
import { PermissionBadge } from './permission-badge';
import { TagList } from './tag-badge';
import { SharedNotesRowActions } from './shared-notes-row-actions';
import { formatDate } from '../utils/format-date';

interface SharedNotesTableRowProps {
  note: SharedNote;
  columns: Record<SharedNoteColumnKey, boolean>;
}

function ownerName(owner: SharedNote['owner']): string {
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
  return name || owner.email;
}

function ownerInitials(owner: SharedNote['owner']): string {
  if (owner.firstName) {
    return (
      (owner.firstName.charAt(0) + (owner.lastName?.charAt(0) ?? '')).toUpperCase()
    );
  }
  return owner.email.charAt(0).toUpperCase();
}

export function SharedNotesTableRow({
  note,
  columns,
}: SharedNotesTableRowProps) {
  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/50">
      <td className="px-4 py-3">
        <strong
          className="text-sm font-medium text-foreground"
          title={note.title}
        >
          <span className="line-clamp-1">{note.title || 'Untitled'}</span>
        </strong>
      </td>

      {columns.owner && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {note.owner.photo ? (
              <img
                src={note.owner.photo}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <abbr className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground" title={ownerName(note.owner)}>
                {ownerInitials(note.owner)}
              </abbr>
            )}
            <span className="text-sm text-foreground">
              {ownerName(note.owner)}
            </span>
          </div>
        </td>
      )}

      {columns.permission && (
        <td className="px-4 py-3">
          <PermissionBadge permission={note.permission} />
        </td>
      )}

      {columns.tags && (
        <td className="hidden px-4 py-3 md:table-cell">
          <TagList tags={note.tags} max={3} />
        </td>
      )}

      {columns.createdAt && (
        <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
          <time>{formatDate(note.createdAt)}</time>
        </td>
      )}

      {columns.sharedOn && (
        <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
          <time>{formatDate(note.sharedOn)}</time>
        </td>
      )}

      <td className="px-4 py-3 text-right">
        <SharedNotesRowActions note={note} shareId={note.shareId} />
      </td>
    </tr>
  );
}
