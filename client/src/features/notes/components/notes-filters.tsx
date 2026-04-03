'use client';

import type { NoteStatus } from '../types';

const tabs: { label: string; value?: NoteStatus }[] = [
  { label: 'All' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Shared', value: 'has_shares' },
];

interface NotesFiltersProps {
  activeStatus?: string;
  onStatusChange: (status?: string) => void;
  isLoading?: boolean;
}

export function NotesFilters({
  activeStatus,
  onStatusChange,
  isLoading,
}: NotesFiltersProps) {
  if (isLoading) {
    return (
      <menu className="flex items-center gap-1">
        {tabs.map(({ label }) => (
          <li key={label}>
            <span className="inline-block h-8 animate-pulse rounded-full bg-muted" style={{ width: `${label.length * 10 + 32}px` }} />
          </li>
        ))}
      </menu>
    );
  }

  return (
    <menu className="flex items-center gap-1">
      {tabs.map(({ label, value }) => {
        const isActive = activeStatus === value;
        return (
          <li key={label}>
            <button
              onClick={() => onStatusChange(value)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {label}
            </button>
          </li>
        );
      })}
    </menu>
  );
}
