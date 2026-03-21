'use client';

import { ColumnsDropdown } from '@/components/shared/columns-dropdown';
import type { ArchivedNoteColumnKey } from '../types';

const columnLabels: Record<ArchivedNoteColumnKey, string> = {
  tags: 'Tags',
  createdAt: 'Created At',
  updatedAt: 'Last Modified',
};

interface ArchivedNotesColumnsDropdownProps {
  columns: Record<ArchivedNoteColumnKey, boolean>;
  onToggle: (key: ArchivedNoteColumnKey) => void;
}

export function ArchivedNotesColumnsDropdown({
  columns,
  onToggle,
}: ArchivedNotesColumnsDropdownProps) {
  return (
    <ColumnsDropdown
      columnLabels={columnLabels}
      columns={columns}
      onToggle={onToggle}
    />
  );
}
