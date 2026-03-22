'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { Badge } from '@/components/shared/badge';
import { getTagColor } from '../utils/tag-colors';

export function TagBadge({ tag }: { tag: string }) {
  return <Badge className={getTagColor(tag)}>#{tag}</Badge>;
}

export function TagList({ tags, max = 3 }: { tags: string[]; max?: number }) {
  const visible = tags.slice(0, max);
  const remaining = tags.slice(max);

  return (
    <ul className="flex flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <li key={tag}>
          <TagBadge tag={tag} />
        </li>
      ))}
      {remaining.length > 0 && (
        <li>
          <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <section className="flex aspect-square cursor-pointer items-center justify-center rounded-full bg-muted p-1 text-[10px] font-bold text-muted-foreground">
                  +{remaining.length}
                </section>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="bottom"
                  sideOffset={6}
                  className="z-50 w-sm rounded-lg border border-border bg-muted px-3 py-2 shadow-lg"
                >
                  <ul className="flex flex-wrap gap-1">
                    {remaining.map((tag) => (
                      <li key={tag}>
                        <TagBadge tag={tag} />
                      </li>
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
