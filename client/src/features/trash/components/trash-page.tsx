'use client';

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { NotesPagination } from '@/features/notes/components/notes-pagination';
import { useTrash } from '../hooks/use-trash';
import { useTrashFilters } from '../hooks/use-trash-filters';
import { useTrashColumnVisibility } from '../hooks/use-trash-column-visibility';
import { useEmptyTrash } from '../hooks/use-trash-mutations';
import { usePreferences } from '../hooks/use-preferences';
import { TrashWarningBanner } from './trash-warning-banner';
import { TrashSearch } from './trash-search';
import { TrashColumnsDropdown } from './trash-columns-dropdown';
import { TrashTable } from './trash-table';
import { TrashEmptyState } from './trash-empty-state';
import { TrashConfirmDialog } from './trash-confirm-dialog';
import { TrashSettingsPopover } from './trash-settings-popover';

export function TrashPage() {
  const { filters, setSearch, setTags, setPage, setLimit } = useTrashFilters();
  const { columns, toggleColumn } = useTrashColumnVisibility();
  const { data, isLoading, isError } = useTrash(filters);
  const emptyTrashMutation = useEmptyTrash();
  const { data: prefs } = usePreferences();
  const [showEmptyDialog, setShowEmptyDialog] = useState(false);

  const retentionDays = prefs?.trashRetentionDays ?? 30;

  const handleSearchChange = useCallback(
    (search: string) => setSearch(search),
    [setSearch],
  );
  const handleTagsChange = useCallback(
    (tags: string) => setTags(tags),
    [setTags],
  );

  const hasFilters = !!(filters.search || filters.tags);
  const isEmpty = data?.total === 0 && !hasFilters;
  const isFilteredEmpty = data?.notes?.length === 0 && hasFilters;

  return (
    <section className="flex h-full flex-col p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Trash</h1>
        <TrashSettingsPopover />
      </header>

      {!isEmpty && !isLoading && (
        <TrashWarningBanner
          retentionDays={retentionDays}
          onEmptyTrash={() => setShowEmptyDialog(true)}
          isEmptying={emptyTrashMutation.isPending}
        />
      )}

      <search className="mb-4 flex items-end gap-4">
        <span className="flex-1">
          <TrashSearch
            onSearchChange={handleSearchChange}
            onTagsChange={handleTagsChange}
          />
        </span>
        <TrashColumnsDropdown columns={columns} onToggle={toggleColumn} />
      </search>

      {isLoading ? (
        <output className="flex flex-1 items-center justify-center" aria-busy="true">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </output>
      ) : isError || !data ? (
        <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">
          Failed to load trash. Please try again later.
        </p>
      ) : isEmpty ? (
        <TrashEmptyState retentionDays={retentionDays} />
      ) : isFilteredEmpty ? (
        <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">
          No trashed notes match your filters.
        </p>
      ) : (
        <>
          <section className="flex-1 overflow-auto">
            <TrashTable
              notes={data!.notes}
              columns={columns}
              retentionDays={retentionDays}
            />
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

      <TrashConfirmDialog
        open={showEmptyDialog}
        variant="emptyTrash"
        onConfirm={() => {
          emptyTrashMutation.mutate(undefined, {
            onSettled: () => setShowEmptyDialog(false),
          });
        }}
        onCancel={() => setShowEmptyDialog(false)}
        isLoading={emptyTrashMutation.isPending}
      />
    </section>
  );
}
