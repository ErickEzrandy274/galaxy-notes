'use client';

import { ColumnsDropdown } from '@/components/shared/columns-dropdown';
import type { ColumnKey } from '../types';

const columnLabels: Record<ColumnKey, string> = {
  status: 'Status',
  tags: 'Tags',
  createdAt: 'Created At',
  lastModified: 'Last Modified',
  shared: 'Shared',
};

interface NotesColumnsDropdownProps {
  columns: Record<ColumnKey, boolean>;
  onToggle: (key: ColumnKey) => void;
}

export function NotesColumnsDropdown({
  columns,
  onToggle,
}: NotesColumnsDropdownProps) {
  return (
    <ColumnsDropdown
      columnLabels={columnLabels}
      columns={columns}
      onToggle={onToggle}
    />
  );
}
