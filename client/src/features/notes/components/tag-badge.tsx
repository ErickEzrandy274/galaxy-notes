'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { getTagColor } from '../utils/tag-colors';

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getTagColor(tag)}`}
    >
      #{tag}
    </span>
  );
}

export function TagList({ tags, max = 3 }: { tags: string[]; max?: number }) {
  const visible = tags.slice(0, max);
  const remaining = tags.slice(max);

  return (
    <ul className="flex flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <li key={tag}><TagBadge tag={tag} /></li>
      ))}
      {remaining.length > 0 && (
        <li>
          <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <span className="flex aspect-square items-center justify-center p-1 rounded-full bg-muted text-[10px] font-bold text-muted-foreground cursor-pointer">
                  +{remaining.length}
                </span>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="bottom"
                  sideOffset={6}
                  className="z-50 rounded-lg border border-border bg-card px-3 py-2 shadow-lg w-sm"
                >
                  <ul className="flex flex-wrap gap-1">
                    {remaining.map((tag) => (
                      <li key={tag}><TagBadge tag={tag} /></li>
                    ))}
                  </ul>
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </li>
      )}
    </ul>
  );
}
