'use client';

import { Search, Tag } from 'lucide-react';
import { SearchField } from '@/components/shared/search-field';

interface NotesSearchProps {
  onSearchChange: (search: string) => void;
  onTagsChange: (tags: string) => void;
}

export function NotesSearch({ onSearchChange, onTagsChange }: NotesSearchProps) {
  return (
    <fieldset className="flex items-end gap-3">
      <SearchField
        label="Title"
        placeholder="Search by title..."
        icon={Search}
        onChange={onSearchChange}
      />
      <SearchField
        label="Tags"
        placeholder="Filter by tags..."
        icon={Tag}
        type="text"
        onChange={onTagsChange}
      />
    </fieldset>
  );
}
