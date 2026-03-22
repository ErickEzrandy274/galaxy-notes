'use client';

import { ColumnsDropdown } from '@/components/shared/columns-dropdown';
import type { TrashColumnKey } from '../types';

const columnLabels: Record<TrashColumnKey, string> = {
  originalStatus: 'Original Status',
  tags: 'Tags',
  createdAt: 'Created At',
  deletedOn: 'Deleted On',
  daysLeft: 'Days Left',
};

interface TrashColumnsDropdownProps {
  columns: Record<TrashColumnKey, boolean>;
  onToggle: (key: TrashColumnKey) => void;
}

export function TrashColumnsDropdown({
  columns,
  onToggle,
}: TrashColumnsDropdownProps) {
  return (
    <ColumnsDropdown
      columnLabels={columnLabels}
      columns={columns}
      onToggle={onToggle}
    />
  );
}
