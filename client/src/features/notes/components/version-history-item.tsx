'use client';

import type { NoteVersionSummary } from '../types';

interface VersionHistoryItemProps {
  version: NoteVersionSummary;
  isLast: boolean;
  isCurrent: boolean;
  isOriginal: boolean;
  isViewing: boolean;
  currentUserId: string;
  onClick: () => void;
}

const SEVEN_DAYS_SEC = 60 * 60 * 24 * 7;

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);

  // Older than 7 days → show exact date and time
  if (Math.abs(diffSec) >= SEVEN_DAYS_SEC) {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSec) >= seconds) {
      const value = Math.round(diffSec / seconds);
      return rtf.format(-value, unit);
    }
  }

  return rtf.format(0, 'second');
}

export function VersionHistoryItem({
  version,
  isLast,
  isCurrent,
  isOriginal,
  isViewing,
  currentUserId,
  onClick,
}: VersionHistoryItemProps) {
  const changedByLabel =
    version.changedBy === currentUserId ? 'You' : version.changedByName;

  const dotColor = isCurrent
    ? 'border-green-500 bg-green-500'
    : isViewing
      ? 'border-orange-500 bg-orange-500'
      : 'border-purple-500 bg-purple-500';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors ${
        isViewing ? 'bg-orange-500/10' : 'hover:bg-muted/50'
      }`}
    >
      {/* Timeline dot + line */}
      <figure className="flex flex-col items-center pt-1.5" aria-hidden="true">
        <mark className={`block h-3 w-3 shrink-0 rounded-full border-2 ${dotColor}`} />
        {!isLast && <hr className="mt-1 w-0.5 flex-1 border-none bg-border" />}
      </figure>

      {/* Content */}
      <section className="min-w-0 flex-1 pb-2">
        <header className="flex items-center justify-between">
          <time
            dateTime={version.createdAt}
            className={`text-sm font-medium ${isViewing ? 'text-orange-500' : 'text-foreground'}`}
          >
            {getRelativeTime(version.createdAt)}
          </time>
          {isViewing && (
            <mark className="rounded-md bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-500">
              Viewing
            </mark>
          )}
        </header>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {changedByLabel}
          {isCurrent && (
            <em className="ml-1 not-italic">&bull; Current version</em>
          )}
          {isOriginal && (
            <em className="ml-1 not-italic">&bull; Original</em>
          )}
        </p>
      </section>
    </button>
  );
}
