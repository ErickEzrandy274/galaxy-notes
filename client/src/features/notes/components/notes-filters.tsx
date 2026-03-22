'use client';

import { FilterTabs } from '@/components/shared/filter-tabs';
import type { NoteStatus } from '../types';

const tabs: { label: string; value?: NoteStatus | 'has_shares' }[] = [
  { label: 'All' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Shared', value: 'has_shares' },
];

interface NotesFiltersProps {
  activeStatus?: string;
  onStatusChange: (status?: string) => void;
}

export function NotesFilters({
  activeStatus,
  onStatusChange,
}: NotesFiltersProps) {
  return (
    <FilterTabs
      tabs={tabs}
      activeValue={activeStatus}
      onChange={onStatusChange}
      ariaLabel="Note status filters"
    />
  );
}
