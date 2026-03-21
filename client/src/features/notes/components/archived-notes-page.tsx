'use client';

import { Archive } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataStateHandler } from '@/components/shared/data-state-handler';
import { Pagination } from '@/components/shared/pagination';
import { useArchivedNotes, useArchivedNotesFilters } from '../hooks/use-archived-notes';
import { useArchivedColumnVisibility } from '../hooks/use-archived-column-visibility';
import { useNoteStats } from '../hooks/use-note-stats';
import { ArchivedNotesTable } from './archived-notes-table';
import { ArchivedNotesSearch } from './archived-notes-search';
import { ArchivedNotesColumnsDropdown } from './archived-notes-columns-dropdown';
import { ArchivedNotesEmptyState } from './archived-notes-empty-state';

export function ArchivedNotesPage() {
  const { filters, setSearch, setTags, setPage, setLimit } =
    useArchivedNotesFilters();
  const { columns, toggle } = useArchivedColumnVisibility();
  const { data, isLoading, isError } = useArchivedNotes(filters);
  const { data: stats, isLoading: statsLoading } = useNoteStats();

  const hasFilters = !!(filters.search || filters.tags);
  const isEmpty = !isLoading && data?.notes.length === 0;

  return (
    <section className="flex h-full flex-col p-6">
      <PageHeader
        icon={Archive}
        iconColorClass="bg-purple-500/10 text-purple-500"
        title="Archived"
      />

      <div className="mb-4">
        {statsLoading ? (
          <div className="h-[72px] w-48 animate-pulse rounded-lg border border-border/50 bg-card" />
        ) : (
          <div className="flex w-48 items-center gap-3 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-3">
            <Archive size={30} className="text-indigo-400" />
            <span className="flex flex-col">
              <span className="text-lg font-semibold leading-tight text-foreground">
                {stats?.archived ?? '—'}
              </span>
              <span className="text-xs text-muted-foreground">Archived</span>
            </span>
          </div>
        )}
      </div>

      <search className="mb-4 flex items-end gap-4">
        <span className="flex-1">
          <ArchivedNotesSearch
            onSearchChange={setSearch}
            onTagsChange={setTags}
          />
        </span>
        <ArchivedNotesColumnsDropdown columns={columns} onToggle={toggle} />
      </search>

      <DataStateHandler
        isLoading={isLoading}
        isError={!!isError}
        isEmpty={isEmpty && !hasFilters}
        isFilteredEmpty={isEmpty && hasFilters}
        entityName="archived notes"
        emptyState={<ArchivedNotesEmptyState />}
      >
        <section className="flex-1 overflow-auto">
          <ArchivedNotesTable notes={data?.notes ?? []} columns={columns} />
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
