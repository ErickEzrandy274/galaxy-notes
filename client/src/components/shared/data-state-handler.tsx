import type { ReactNode } from 'react';
import { Spinner } from '@/components/primitives';

interface DataStateHandlerProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  isFilteredEmpty: boolean;
  entityName: string;
  emptyState: ReactNode;
  children: ReactNode;
}

export function DataStateHandler({
  isLoading,
  isError,
  isEmpty,
  isFilteredEmpty,
  entityName,
  emptyState,
  children,
}: DataStateHandlerProps) {
  if (isLoading) {
    return (
      <output
        className="flex flex-1 items-center justify-center"
        aria-busy="true"
      >
        <Spinner size="xl" />
      </output>
    );
  }

  if (isError) {
    return (
      <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">
        Failed to load {entityName}. Please try again later.
      </p>
    );
  }

  if (isEmpty) {
    return <>{emptyState}</>;
  }

  if (isFilteredEmpty) {
    return (
      <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">
        No {entityName} match your filters.
      </p>
    );
  }

  return <>{children}</>;
}
