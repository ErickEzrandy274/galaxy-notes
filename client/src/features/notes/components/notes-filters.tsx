'use client';

import type { NoteStatus } from '../types';

const tabs: { label: string; value?: NoteStatus }[] = [
  { label: 'All' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Shared', value: 'shared' },
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
