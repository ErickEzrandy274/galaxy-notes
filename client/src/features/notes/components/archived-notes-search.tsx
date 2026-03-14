'use client';

import { Search, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ArchivedNotesSearchProps {
  onSearchChange: (value: string) => void;
  onTagsChange: (value: string) => void;
}

export function ArchivedNotesSearch({
  onSearchChange,
  onTagsChange,
}: ArchivedNotesSearchProps) {
  const [searchInput, setSearchInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    const id = setTimeout(() => onSearchChange(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput, onSearchChange]);

  useEffect(() => {
    const id = setTimeout(() => onTagsChange(tagsInput), 300);
    return () => clearTimeout(id);
  }, [tagsInput, onTagsChange]);

  return (
    <fieldset className="flex items-end gap-3">
      <label className="flex-1">
        <span className="mb-1 block text-sm font-medium text-foreground">Title</span>
        <span className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2">
          <Search size={16} className="text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </span>
      </label>
      <label className="flex-1">
        <span className="mb-1 block text-sm font-medium text-foreground">Tags</span>
        <span className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2">
          <Tag size={16} className="text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            placeholder="Filter by tags..."
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </span>
      </label>
    </fieldset>
  );
}
