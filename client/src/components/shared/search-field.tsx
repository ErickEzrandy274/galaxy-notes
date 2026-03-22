'use client';

import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchFieldProps {
  label: string;
  placeholder: string;
  icon: LucideIcon;
  type?: 'search' | 'text';
  debounceMs?: number;
  onChange: (value: string) => void;
}

export function SearchField({
  label,
  placeholder,
  icon: Icon,
  type = 'search',
  debounceMs = 300,
  onChange,
}: SearchFieldProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onChange(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, onChange, debounceMs]);

  return (
    <label className="flex-1">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label}
      </span>
      <span className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2">
        <Icon size={16} className="text-muted-foreground" aria-hidden="true" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </span>
    </label>
  );
}
