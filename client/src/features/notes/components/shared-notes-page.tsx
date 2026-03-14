'use client';

import { useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useSharedNotes, useSharedNotesFilters } from '../hooks/use-shared-notes';
import { useSharedColumnVisibility } from '../hooks/use-shared-column-visibility';
import { SharedNotesFilters } from './shared-notes-filters';
import { SharedNotesSearch } from './shared-notes-search';
import { SharedNotesColumnsDropdown } from './shared-notes-columns-dropdown';
import { SharedNotesTable } from './shared-notes-table';
import { NotesPagination } from './notes-pagination';
import { SharedNotesEmptyState } from './shared-notes-empty-state';

export function SharedNotesPage() {
  const {
    filters,
    setPermission,
    setSearch,
    setOwnerSearch,
    setTags,
    setPage,
    setLimit,
  } = useSharedNotesFilters();
  const { columns, toggleColumn } = useSharedColumnVisibility();
  const { data, isLoading, isError } = useSharedNotes(filters);

  const handleSearchChange = useCallback(
    (search: string) => setSearch(search),
    [setSearch],
  );
  const handleOwnerSearchChange = useCallback(
    (ownerSearch: string) => setOwnerSearch(ownerSearch),
    [setOwnerSearch],
  );
  const handleTagsChange = useCallback(
    (tags: string) => setTags(tags),
    [setTags],
  );

  const hasFilters = !!(
    filters.permission ||
    filters.search ||
    filters.ownerSearch ||
    filters.tags
  );
  const isEmpty = data?.total === 0 && !hasFilters;
  const isFilteredEmpty = data?.notes?.length === 0 && hasFilters;

  return (
    <section className="flex h-full flex-col p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Shared with Me</h1>
      </header>

      <nav className="mb-4" aria-label="Permission filters">
        <SharedNotesFilters
          activePermission={filters.permission}
          onPermissionChange={setPermission}
        />
      </nav>

      <search className="mb-4 flex items-end gap-4">
        <span className="flex-1">
          <SharedNotesSearch
            onSearchChange={handleSearchChange}
            onOwnerSearchChange={handleOwnerSearchChange}
            onTagsChange={handleTagsChange}
          />
        </span>
        <SharedNotesColumnsDropdown columns={columns} onToggle={toggleColumn} />
      </search>

      {isLoading ? (
        <output
          className="flex flex-1 items-center justify-center"
          aria-busy="true"
        >
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </output>
      ) : isError || !data ? (
        <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">
          Failed to load shared notes. Please try again later.
        </p>
      ) : isEmpty ? (
        <SharedNotesEmptyState />
      ) : isFilteredEmpty ? (
        <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">
          No shared notes match your filters.
        </p>
      ) : (
        <>
          <section className="flex-1 overflow-auto">
            <SharedNotesTable notes={data.notes} columns={columns} />
          </section>
          <NotesPagination
            page={data.page}
            limit={data.limit}
            total={data.total}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      )}
    </section>
  );
}
