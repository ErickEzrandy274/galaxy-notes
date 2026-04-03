'use client';

import { Loader2, Archive } from 'lucide-react';
import { useArchivedNotes, useArchivedNotesFilters } from '../hooks/use-archived-notes';
import { useArchivedColumnVisibility } from '../hooks/use-archived-column-visibility';
import { useNoteStats } from '../hooks/use-note-stats';
import { ArchivedNotesTable } from './archived-notes-table';
import { ArchivedNotesSearch } from './archived-notes-search';
import { ArchivedNotesColumnsDropdown } from './archived-notes-columns-dropdown';
import { ArchivedNotesEmptyState } from './archived-notes-empty-state';
import { NotesPagination } from './notes-pagination';

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
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Archive className="h-5 w-5 text-purple-500" />
          </span>
          <h1 className="text-xl font-bold text-foreground">Archived</h1>
        </div>
      </header>

      <section className="mb-4" aria-label="Archive statistics">
        {statsLoading ? (
          <div className="h-[72px] w-48 animate-pulse rounded-lg border border-border/50 bg-card" />
        ) : (
          <div className="flex w-48 items-center gap-3 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-3">
            <Archive size={30} className="text-indigo-400" />
            <span className="flex flex-col">
              <strong className="text-lg font-semibold leading-tight text-foreground">
                {stats?.archived ?? '—'}
              </strong>
              <small className="text-xs text-muted-foreground">Archived</small>
            </span>
          </div>
        )}
      </section>

      <search className="mb-4 flex items-end gap-4">
        <div className="flex-1">
          <ArchivedNotesSearch
            onSearchChange={setSearch}
            onTagsChange={setTags}
          />
        </div>
        <ArchivedNotesColumnsDropdown columns={columns} onToggle={toggle} />
      </search>

      {isLoading ? (
        <output
          className="flex flex-1 items-center justify-center"
          aria-busy="true"
        >
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </output>
      ) : isError ? (
        <output className="flex flex-1 items-center justify-center text-sm text-destructive">
          Failed to load archived notes.
        </output>
      ) : isEmpty && !hasFilters ? (
        <ArchivedNotesEmptyState />
      ) : isEmpty && hasFilters ? (
        <section className="flex flex-1 flex-col items-center justify-center py-24">
          <p className="text-sm text-muted-foreground">
            No archived notes match your filters.
          </p>
        </section>
      ) : (
        <>
          <section className="flex-1 overflow-auto">
            <ArchivedNotesTable notes={data!.notes} columns={columns} />
          </section>
          <NotesPagination
            page={data!.page}
            limit={data!.limit}
            total={data!.total}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      )}
    </section>
  );
}
