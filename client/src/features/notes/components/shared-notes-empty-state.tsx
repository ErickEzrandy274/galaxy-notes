'use client';

import { Users } from 'lucide-react';

export function SharedNotesEmptyState() {
  return (
    <output className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Users size={70} className="text-muted-foreground/30" strokeWidth={1} />
      <section>
        <h3 className="text-lg font-semibold text-foreground">
          No shared notes
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Notes shared with you by others will appear here.
        </p>
      </section>
    </output>
  );
}
