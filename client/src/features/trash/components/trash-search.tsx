'use client';

import { Search, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TrashSearchProps {
  onSearchChange: (search: string) => void;
  onTagsChange: (tags: string) => void;
}

export function TrashSearch({ onSearchChange, onTagsChange }: TrashSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [tagsValue, setTagsValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue, onSearchChange]);

  useEffect(() => {
    const timer = setTimeout(() => onTagsChange(tagsValue), 300);
    return () => clearTimeout(timer);
  }, [tagsValue, onTagsChange]);

  return (
    <fieldset className="flex items-end gap-3">
      <label className="flex-1">
        <span className="mb-1 block text-sm font-medium text-foreground">Title</span>
        <span className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2">
          <Search size={16} className="text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by title..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </span>
      </label>
      <label className="hidden flex-1 md:block">
        <span className="mb-1 block text-sm font-medium text-foreground">Tags</span>
        <span className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2">
          <Tag size={16} className="text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            placeholder="Filter by tags..."
            value={tagsValue}
            onChange={(e) => setTagsValue(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </span>
      </label>
    </fieldset>
  );
}
