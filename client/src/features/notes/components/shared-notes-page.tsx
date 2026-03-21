'use client';

import { useCallback } from 'react';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataStateHandler } from '@/components/shared/data-state-handler';
import { Pagination } from '@/components/shared/pagination';
import { useSharedNotes, useSharedNotesFilters } from '../hooks/use-shared-notes';
import { useSharedColumnVisibility } from '../hooks/use-shared-column-visibility';
import { SharedNotesFilters } from './shared-notes-filters';
import { SharedNotesSearch } from './shared-notes-search';
import { SharedNotesColumnsDropdown } from './shared-notes-columns-dropdown';
import { SharedNotesTable } from './shared-notes-table';
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
      <PageHeader
        icon={Users}
        iconColorClass="bg-emerald-500/10 text-emerald-500"
        title="Shared with Me"
      />

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

      <DataStateHandler
        isLoading={isLoading}
        isError={isError || !data}
        isEmpty={isEmpty}
        isFilteredEmpty={isFilteredEmpty}
        entityName="shared notes"
        emptyState={<SharedNotesEmptyState />}
      >
        <section className="flex-1 overflow-auto">
          <SharedNotesTable notes={data?.notes ?? []} columns={columns} />
        </section>
        <Pagination
          page={data?.page ?? 1}
          limit={data?.limit ?? 10}
          total={data?.total ?? 0}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </DataStateHandler>
    </section>
  );
}
