'use client';

import { FilterTabs } from '@/components/shared/filter-tabs';

const tabs: Array<{ label: string; value?: 'READ' | 'WRITE' }> = [
  { label: 'All' },
  { label: 'Read Only', value: 'READ' },
  { label: 'Can Edit', value: 'WRITE' },
];

interface SharedNotesFiltersProps {
  activePermission?: 'READ' | 'WRITE';
  onPermissionChange: (permission?: 'READ' | 'WRITE') => void;
}

export function SharedNotesFilters({
  activePermission,
  onPermissionChange,
}: SharedNotesFiltersProps) {
  return (
    <FilterTabs
      tabs={tabs}
      activeValue={activePermission}
      onChange={onPermissionChange}
      ariaLabel="Permission filters"
    />
  );
}
