'use client';

import { Search, Tag, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SharedNotesSearchProps {
  onSearchChange: (search: string) => void;
  onOwnerSearchChange: (ownerSearch: string) => void;
  onTagsChange: (tags: string) => void;
  isLoading?: boolean;
}

export function SharedNotesSearch({
  onSearchChange,
  onOwnerSearchChange,
  onTagsChange,
  isLoading,
}: SharedNotesSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [ownerValue, setOwnerValue] = useState('');
  const [tagsValue, setTagsValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue, onSearchChange]);

  useEffect(() => {
    const timer = setTimeout(() => onOwnerSearchChange(ownerValue), 300);
    return () => clearTimeout(timer);
  }, [ownerValue, onOwnerSearchChange]);

  useEffect(() => {
    const timer = setTimeout(() => onTagsChange(tagsValue), 300);
    return () => clearTimeout(timer);
  }, [tagsValue, onTagsChange]);

  if (isLoading) {
    return (
      <fieldset className="flex items-end gap-3">
        {['Title', 'Owner', 'Tags'].map((label) => (
          <div key={label} className="flex-1">
            <span className="mb-1 block h-4 w-10 animate-pulse rounded bg-muted" />
            <span className="mt-1 block h-[38px] animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </fieldset>
    );
  }

  return (
    <fieldset className="flex items-end gap-3">
      <label className="flex-1">
        <span className="mb-1 block text-sm font-medium text-foreground">
          Title
        </span>
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
      <label className="flex-1">
        <span className="mb-1 block text-sm font-medium text-foreground">
          Owner
        </span>
        <span className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2">
          <User size={16} className="text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by owner..."
            value={ownerValue}
            onChange={(e) => setOwnerValue(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </span>
      </label>
      <label className="flex-1">
        <span className="mb-1 block text-sm font-medium text-foreground">
          Tags
        </span>
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
