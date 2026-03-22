'use client';

import { Search, Tag, User } from 'lucide-react';
import { SearchField } from '@/components/shared/search-field';

interface SharedNotesSearchProps {
  onSearchChange: (search: string) => void;
  onOwnerSearchChange: (ownerSearch: string) => void;
  onTagsChange: (tags: string) => void;
}

export function SharedNotesSearch({
  onSearchChange,
  onOwnerSearchChange,
  onTagsChange,
}: SharedNotesSearchProps) {
  return (
    <fieldset className="flex items-end gap-3">
      <SearchField
        label="Title"
        placeholder="Search by title..."
        icon={Search}
        onChange={onSearchChange}
      />
      <SearchField
        label="Owner"
        placeholder="Search by owner..."
        icon={User}
        onChange={onOwnerSearchChange}
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
