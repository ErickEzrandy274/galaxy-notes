'use client';

import { useState, useEffect } from 'react';
import { Search, Tag } from 'lucide-react';

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

  const inputClass =
    'h-9 rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <search className="flex items-center gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">Title</span>
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={inputClass}
          />
        </div>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">Tags</span>
        <div className="relative">
          <Tag
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Filter by tags..."
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className={inputClass}
          />
        </div>
      </label>
    </search>
  );
}
