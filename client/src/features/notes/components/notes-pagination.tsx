'use client';

import { ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const LIMIT_OPTIONS = [10, 20, 50, 100] as const;

interface NotesPaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function NotesPagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: NotesPaginationProps) {
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total === 0) return null;

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav className="flex items-center justify-between pt-4" aria-label="Pagination">
      <span className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Showing {start} to {end} of {total} entries
        </p>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
              {limit} Rows
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={4}
              className="z-50 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg"
            >
              <DropdownMenu.RadioGroup
                value={String(limit)}
                onValueChange={(v) => onLimitChange(Number(v))}
              >
                {LIMIT_OPTIONS.map((opt) => (
                  <DropdownMenu.RadioItem
                    key={opt}
                    value={String(opt)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted"
                  >
                    <span className="flex-1">{opt} Rows</span>
                    <DropdownMenu.ItemIndicator>
                      <Check size={14} className="text-primary" />
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </span>
      <ul className="flex items-center gap-1">
        <li>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={14} />
            Prev
          </button>
        </li>
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <li key={`ellipsis-${i}`}>
              <span className="px-2 py-1.5 text-sm text-muted-foreground">
                ...
              </span>
            </li>
          ) : (
            <li key={p}>
              <button
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] cursor-pointer rounded-lg px-2 py-1.5 text-sm font-medium ${
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
