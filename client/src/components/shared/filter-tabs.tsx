'use client';

interface FilterTab<V extends string> {
  label: string;
  value?: V;
}

interface FilterTabsProps<V extends string> {
  tabs: FilterTab<V>[];
  activeValue?: V;
  onChange: (value?: V) => void;
  ariaLabel?: string;
}

export function FilterTabs<V extends string>({
  tabs,
  activeValue,
  onChange,
  ariaLabel,
}: FilterTabsProps<V>) {
  return (
    <menu className="flex items-center gap-1" aria-label={ariaLabel}>
      {tabs.map(({ label, value }) => {
        const isActive = activeValue === value;
        return (
          <li key={label}>
            <button
              type="button"
              onClick={() => onChange(value)}
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
