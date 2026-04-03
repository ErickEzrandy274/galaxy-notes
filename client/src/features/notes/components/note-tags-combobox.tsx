'use client';

import { useState, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, Plus, Search, Tag, X } from 'lucide-react';
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

  const hasNoTags = tagOptions.length === 0;
  const showNoMatch = filteredTags.length === 0 && search.trim();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div
          role="group"
          aria-labelledby="tags-label"
          className="flex min-h-[42px] flex-1 cursor-pointer flex-wrap items-center gap-1.5 rounded-lg border border-border bg-input px-3 py-2"
        >
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(tag)}`}
            >
              #{tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="cursor-pointer rounded-full p-0.5 hover:bg-black/10"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <span className="text-sm text-muted-foreground">Add tag...</span>
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-64 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            searchInputRef.current?.focus();
          }}
        >
          {/* Search input */}
          <label className="flex items-center gap-2 border-b border-zinc-700 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canCreateNew) {
                  e.preventDefault();
                  createTag();
                }
              }}
              placeholder="Type to create a new tag..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </label>

          {/* Tag list / empty states */}
          <div className="max-h-52 overflow-y-auto">
            {/* Empty state - no tags exist at all */}
            {hasNoTags && !search.trim() && (
              <section className="flex flex-col items-center gap-1 px-4 py-6 text-center">
                <Tag className="mb-1 h-8 w-8 text-amber-400/80" />
                <p className="text-sm font-medium text-foreground">
                  No previous tags
                </p>
                <p className="text-xs text-muted-foreground">
                  Start typing to create your first tag
                </p>
              </section>
            )}

            {/* Tag options list */}
            {filteredTags.length > 0 && (
              <ul className="p-1" role="listbox">
                {filteredTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name);
                  return (
                    <li
                      key={tag.name}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-800"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-zinc-600'
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
              </ul>
            )}

            {/* No matching tags found */}
            {showNoMatch && (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                No matching tags found
              </p>
            )}

            {/* Non-empty tags but no results and not empty state */}
            {!hasNoTags &&
              filteredTags.length === 0 &&
              !canCreateNew &&
              !search.trim() && (
                <p className="px-3 py-3 text-center text-sm text-muted-foreground">
                  No tags found
                </p>
              )}
          </div>

          {/* Create new tag button */}
          {canCreateNew && (
            <div className="border-t border-zinc-700 p-1">
              <button
                type="button"
                onClick={createTag}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-primary hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                <span>Create</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(search.trim())}`}
                >
                  #{search.trim()}
                </span>
              </button>
            </div>
          )}

          {/* Create new tag - empty state bottom button */}
          {!canCreateNew && !search.trim() && (
            <div className="border-t border-zinc-700 p-1">
              <button
                type="button"
                onClick={() => searchInputRef.current?.focus()}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-primary hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Create new tag
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
