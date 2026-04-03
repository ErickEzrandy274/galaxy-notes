'use client';

import { countWords, countCharacters } from '../utils/word-count';

interface NoteInfoPanelProps {
  content: string;
  createdAt?: string;
  version: number;
}

function formatInfoDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function NoteInfoPanel({
  content,
  createdAt,
  version,
}: NoteInfoPanelProps) {
  const words = countWords(content);
  const characters = countCharacters(content);

  return (
    <section aria-label="Note information">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Info</h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Words</dt>
          <dd className="font-medium text-foreground">{words}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Characters</dt>
          <dd className="font-medium text-foreground">{characters}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="font-medium text-foreground">
            {createdAt ? <time dateTime={createdAt}>{formatInfoDate(createdAt)}</time> : 'Just now'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Version</dt>
          <dd className="font-medium text-foreground">
            {version === 1 ? 'v1 (new)' : `v${version}`}
          </dd>
        </div>
      </dl>
    </section>
  );
}
