'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { FileText, Loader2, Plus } from 'lucide-react';
import { useNotes } from '../hooks/use-notes';
import { useNotesFilters } from '../hooks/use-notes-filters';
import { useColumnVisibility } from '../hooks/use-column-visibility';
import { NotesStats } from './notes-stats';
import { NotesFilters } from './notes-filters';
import { NotesSearch } from './notes-search';
import { NotesColumnsDropdown } from './notes-columns-dropdown';
import { NotesTable } from './notes-table';
import { NotesPagination } from './notes-pagination';
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
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <FileText className="h-5 w-5 text-blue-500" />
          </span>
          <h1 className="text-xl font-bold text-foreground">My Notes</h1>
        </div>
        <Link
          href="/notes/new"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={18} />
          New Note
        </Link>
      </header>

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

      {isLoading ? (
        <output className="flex flex-1 items-center justify-center" aria-busy="true">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </output>
      ) : isError || !data ? (
        <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">
          Failed to load notes. Please try again later.
        </p>
      ) : isEmpty ? (
        <NotesEmptyState />
      ) : isFilteredEmpty ? (
        <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">
          No notes match your filters.
        </p>
      ) : (
        <>
          <section className="flex-1 overflow-auto">
            <NotesTable notes={data!.notes} columns={columns} />
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
