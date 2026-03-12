'use client';

import { Mail } from 'lucide-react';
import type { NoteStatus } from '../types';

interface NoteSharePanelProps {
  noteStatus: NoteStatus;
}

export function NoteSharePanel({ noteStatus }: NoteSharePanelProps) {
  const isPublished = noteStatus === 'published';

  return (
    <section aria-label="Sharing">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Sharing</h3>
      {!isPublished && (
        <p className="mb-2 text-sm text-muted-foreground">
          Publish note first to enable sharing
        </p>
      )}
      <label className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <input
          type="email"
          placeholder="Enter email..."
          disabled={!isPublished}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>
    </section>
  );
}
