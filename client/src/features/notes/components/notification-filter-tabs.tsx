'use client';

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
    <nav className="flex gap-2" aria-label="Notification filters">
      {tabs.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
