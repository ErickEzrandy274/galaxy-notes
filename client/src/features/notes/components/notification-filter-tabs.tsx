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
  isLoading?: boolean;
}

export function NotificationFilterTabs({
  active,
  onChange,
  isLoading,
}: NotificationFilterTabsProps) {
  if (isLoading) {
    return (
      <nav aria-label="Notification filters">
        <menu className="flex gap-2 overflow-x-auto">
          {tabs.map(({ value, label }) => (
            <li key={value}>
              <span className="inline-block h-8 animate-pulse rounded-full bg-muted" style={{ width: `${label.length * 10 + 32}px` }} />
            </li>
          ))}
        </menu>
      </nav>
    );
  }

  return (
    <nav aria-label="Notification filters">
      <menu className="flex gap-2 overflow-x-auto">
        {tabs.map(({ value, label }) => (
          <li key={value}>
            <button
              onClick={() => onChange(value)}
              className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          </li>
        ))}
      </menu>
    </nav>
  );
}
