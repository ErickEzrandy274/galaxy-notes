'use client';

import { ChevronDown, Check } from 'lucide-react';
import * as Select from '@radix-ui/react-select';

interface SharePermissionSelectProps {
  value: 'READ' | 'WRITE';
  onChange: (permission: 'READ' | 'WRITE') => void;
  disabled?: boolean;
}

const options = [
  { value: 'READ', label: 'Can View' },
  { value: 'WRITE', label: 'Can Edit' },
] as const;

export function SharePermissionSelect({ value, onChange, disabled }: SharePermissionSelectProps) {
  return (
    <Select.Root
      value={value}
      onValueChange={(v) => onChange(v as 'READ' | 'WRITE')}
      disabled={disabled}
    >
      <Select.Trigger
        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-input px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Permission"
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-[100] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          <Select.Viewport className="p-1">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground outline-none hover:bg-muted data-[highlighted]:bg-muted"
              >
                <Select.ItemIndicator className="w-3">
                  <Check className="h-3 w-3" />
                </Select.ItemIndicator>
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
