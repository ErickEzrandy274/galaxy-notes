'use client';

import { ColumnsDropdown } from '@/components/shared/columns-dropdown';
import type { SharedNoteColumnKey } from '../types';

const columnLabels: Record<SharedNoteColumnKey, string> = {
  owner: 'Owner',
  permission: 'Permission',
  tags: 'Tags',
  createdAt: 'Created At',
  sharedOn: 'Shared On',
};

interface SharedNotesColumnsDropdownProps {
  columns: Record<SharedNoteColumnKey, boolean>;
  onToggle: (key: SharedNoteColumnKey) => void;
}

export function SharedNotesColumnsDropdown({
  columns,
  onToggle,
}: SharedNotesColumnsDropdownProps) {
  return (
    <ColumnsDropdown
      columnLabels={columnLabels}
      columns={columns}
      onToggle={onToggle}
    />
  );
}
