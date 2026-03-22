'use client';

import { useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataStateHandler } from '@/components/shared/data-state-handler';
import { Pagination } from '@/components/shared/pagination';
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
      <PageHeader
        icon={Trash2}
        iconColorClass="bg-red-500/10 text-red-500"
        title="Trash"
        action={<TrashSettingsPopover />}
      />

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

      <DataStateHandler
        isLoading={isLoading}
        isError={isError || !data}
        isEmpty={isEmpty}
        isFilteredEmpty={isFilteredEmpty}
        entityName="trash"
        emptyState={<TrashEmptyState retentionDays={retentionDays} />}
      >
        <section className="flex-1 overflow-auto">
          <TrashTable
            notes={data?.notes ?? []}
            columns={columns}
            retentionDays={retentionDays}
          />
        </section>
        <Pagination
          page={data?.page ?? 1}
          limit={data?.limit ?? 10}
          total={data?.total ?? 0}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </DataStateHandler>

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
