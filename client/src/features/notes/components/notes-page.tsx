'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataStateHandler } from '@/components/shared/data-state-handler';
import { Pagination } from '@/components/shared/pagination';
import { useNotes } from '../hooks/use-notes';
import { useNotesFilters } from '../hooks/use-notes-filters';
import { useColumnVisibility } from '../hooks/use-column-visibility';
import { NotesStats } from './notes-stats';
import { NotesFilters } from './notes-filters';
import { NotesSearch } from './notes-search';
import { NotesColumnsDropdown } from './notes-columns-dropdown';
import { NotesTable } from './notes-table';
import { NotesEmptyState } from './notes-empty-state';

export function NotesPage() {
  const { filters, setStatus, setSearch, setTags, setPage, setLimit } =
    useNotesFilters();
  const { columns, toggleColumn } = useColumnVisibility();
  const { data, isLoading, isError } = useNotes(filters);

  const handleSearchChange = useCallback(
    (search: string) => setSearch(search),
    [setSearch],
  );
  const handleTagsChange = useCallback(
    (tags: string) => setTags(tags),
    [setTags],
  );

  const hasFilters = !!(filters.status || filters.search || filters.tags);
  const isEmpty = data?.total === 0 && !hasFilters;
  const isFilteredEmpty = data?.notes?.length === 0 && hasFilters;

  return (
    <section className="flex h-full flex-col p-6">
      <PageHeader
        icon={FileText}
        iconColorClass="bg-blue-500/10 text-blue-500"
        title="My Notes"
        action={
          <Link
            href="/notes/new"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={18} />
            New Note
          </Link>
        }
      />

      <div className="mb-4">
        <NotesStats activeFilter={filters.status} onFilterChange={setStatus} />
      </div>

      <nav className="mb-4" aria-label="Note status filters">
        <NotesFilters
          activeStatus={filters.status}
          onStatusChange={setStatus}
        />
      </nav>

      <search className="mb-4 flex items-end gap-4">
        <span className="flex-1">
          <NotesSearch
            onSearchChange={handleSearchChange}
            onTagsChange={handleTagsChange}
          />
        </span>
        <NotesColumnsDropdown columns={columns} onToggle={toggleColumn} />
      </search>

      <DataStateHandler
        isLoading={isLoading}
        isError={isError || !data}
        isEmpty={isEmpty}
        isFilteredEmpty={isFilteredEmpty}
        entityName="notes"
        emptyState={<NotesEmptyState />}
      >
        <section className="flex-1 overflow-auto">
          <NotesTable notes={data?.notes ?? []} columns={columns} />
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
