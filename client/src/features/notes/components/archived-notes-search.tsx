'use client';

import { Search, Tag } from 'lucide-react';
import { SearchField } from '@/components/shared/search-field';

interface ArchivedNotesSearchProps {
  onSearchChange: (value: string) => void;
  onTagsChange: (value: string) => void;
}

export function ArchivedNotesSearch({
  onSearchChange,
  onTagsChange,
}: ArchivedNotesSearchProps) {
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
