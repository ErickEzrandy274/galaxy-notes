'use client';

import { ChevronDown, Check, Grid2x2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ColumnsDropdownProps<K extends string> {
  columnLabels: Record<K, string>;
  columns: Record<K, boolean>;
  onToggle: (key: K) => void;
}

export function ColumnsDropdown<K extends string>({
  columnLabels,
  columns,
  onToggle,
}: ColumnsDropdownProps<K>) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          <Grid2x2 size={14} />
          Columns
          <ChevronDown size={14} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-[160px] mt-2 rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {(Object.keys(columnLabels) as K[]).map((key) => (
            <DropdownMenu.CheckboxItem
              key={key}
              checked={columns[key]}
              onCheckedChange={() => onToggle(key)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  columns[key]
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}
              >
                {columns[key] && (
                  <Check size={12} className="text-primary-foreground" />
                )}
              </span>
              {columnLabels[key]}
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
