'use client';

import { FilterTabs } from '@/components/shared/filter-tabs';
import type { NotificationFilter } from '../types';

const tabs: { value: NotificationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'shared', label: 'Shared Notes' },
  { value: 'muted', label: 'Muted Users' },
];

interface NotificationFilterTabsProps {
  active: NotificationFilter;
  onChange: (filter: NotificationFilter) => void;
}

export function NotificationFilterTabs({
  active,
  onChange,
}: NotificationFilterTabsProps) {
  return (
    <FilterTabs
      tabs={tabs}
      activeValue={active}
      onChange={(v) => onChange(v ?? 'all')}
      ariaLabel="Notification filters"
    />
  );
}
