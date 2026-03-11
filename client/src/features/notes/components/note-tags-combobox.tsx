'use client';

import { useState, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, Plus, Search, X } from 'lucide-react';
import { useNoteTags } from '../hooks/use-note-tags';
import { getTagColor } from '../utils/tag-colors';

interface NoteTagsComboboxProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export function NoteTagsCombobox({
  selectedTags,
  onChange,
}: NoteTagsComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: tagOptions = [] } = useNoteTags();

  const filteredTags = tagOptions.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const canCreateNew =
    search.trim() &&
    !tagOptions.some(
      (t) => t.name.toLowerCase() === search.trim().toLowerCase(),
    ) &&
    !selectedTags.some(
      (t) => t.toLowerCase() === search.trim().toLowerCase(),
    );

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const createTag = () => {
    const newTag = search.trim();
    if (newTag && !selectedTags.includes(newTag)) {
      onChange([...selectedTags, newTag]);
      setSearch('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-foreground">Tags</legend>

      <span className="flex flex-wrap items-center gap-1.5">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(tag)}`}
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 hover:bg-black/10"
              aria-label={`Remove ${tag} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              Add tag...
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={4}
              className="z-50 w-64 rounded-lg border border-border bg-card p-2 shadow-lg"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                searchInputRef.current?.focus();
              }}
            >
              <label className="flex items-center gap-2 rounded-md border border-border bg-input px-2 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </label>

              <ul className="mt-2 max-h-48 overflow-y-auto" role="listbox">
                {filteredTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name);
                  return (
                    <li key={tag.name} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-border'
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </span>
                        <span className="flex-1 text-left text-foreground">
                          {tag.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tag.count}
                        </span>
                      </button>
                    </li>
                  );
                })}

                {filteredTags.length === 0 && !canCreateNew && (
                  <li className="px-2 py-3 text-center text-sm text-muted-foreground">
                    No tags found
                  </li>
                )}

                {canCreateNew && (
                  <li>
                    <button
                      type="button"
                      onClick={createTag}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-muted"
                    >
                      <Plus className="h-4 w-4" />
                      Create &quot;{search.trim()}&quot;
                    </button>
                  </li>
                )}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </span>
    </fieldset>
  );
}
