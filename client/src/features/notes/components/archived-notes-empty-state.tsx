'use client';

import { Archive } from 'lucide-react';

export function ArchivedNotesEmptyState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center py-24">
      <figure className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted" aria-hidden="true">
        <Archive className="h-8 w-8 text-muted-foreground" />
      </figure>
      <h2 className="mt-4 text-lg font-semibold text-foreground">
        No archived notes
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Notes you archive will appear here for safekeeping.
      </p>
    </section>
  );
}
