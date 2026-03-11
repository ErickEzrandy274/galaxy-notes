'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NotesPaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function NotesPagination({
  page,
  limit,
  total,
  onPageChange,
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
      <p className="text-sm text-muted-foreground">
        Showing {start}&ndash;{end} of {total} notes
      </p>
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
