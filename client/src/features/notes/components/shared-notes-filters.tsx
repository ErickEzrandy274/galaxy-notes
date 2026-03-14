'use client';

interface SharedNotesFiltersProps {
  activePermission?: 'READ' | 'WRITE';
  onPermissionChange: (permission?: 'READ' | 'WRITE') => void;
}

const tabs: Array<{ label: string; value?: 'READ' | 'WRITE' }> = [
  { label: 'All' },
  { label: 'Read Only', value: 'READ' },
  { label: 'Can Edit', value: 'WRITE' },
];

export function SharedNotesFilters({
  activePermission,
  onPermissionChange,
}: SharedNotesFiltersProps) {
  return (
    <menu className="flex gap-1">
      {tabs.map(({ label, value }) => {
        const isActive = activePermission === value;
        return (
          <li key={label}>
            <button
              type="button"
              onClick={() => onPermissionChange(value)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
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
