'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { NotificationRow } from './notification-row';
import type { NotificationItem } from '../types';

function groupByDate(
  notifications: NotificationItem[],
): Map<string, NotificationItem[]> {
  const groups = new Map<string, NotificationItem[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const notif of notifications) {
    const date = new Date(notif.createdAt);
    let label: string;

    if (date.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year:
          date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }

    const group = groups.get(label) ?? [];
    group.push(notif);
    groups.set(label, group);
  }

  return groups;
}

interface NotificationListProps {
  notifications: NotificationItem[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function NotificationList({
  notifications,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: NotificationListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const groups = groupByDate(notifications);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '200px',
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleIntersection]);

  return (
    <section className="flex-1 overflow-auto">
      {Array.from(groups.entries()).map(([label, items]) => (
        <section key={label} className="mb-2">
          <h3 className="sticky top-0 z-10 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
            {label}
          </h3>
          {items.map((notif) => (
            <NotificationRow key={notif.id} notification={notif} />
          ))}
        </section>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <output className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Loading more...
        </output>
      )}
    </section>
  );
}
