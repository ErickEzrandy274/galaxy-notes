'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { NotificationFilterTabs } from './notification-filter-tabs';
import { NotificationList } from './notification-list';
import { NotificationEmptyState } from './notification-empty-state';
import { MutedUsersList } from './muted-users-list';
import {
  useInfiniteNotifications,
  useMarkAllNotificationsRead,
  useUnreadNotificationCount,
} from '../hooks/use-notifications';
import type { NotificationFilter } from '../types';

export function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const isMutedTab = filter === 'muted';
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteNotifications(filter, 10, { enabled: !isMutedTab });
  const markAllRead = useMarkAllNotificationsRead();
  const { data: unreadData } = useUnreadNotificationCount();

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const hasUnread = (unreadData?.count ?? 0) > 0;

  return (
    <section className="flex h-full flex-col p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        {hasUnread && !isMutedTab && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {markAllRead.isPending ? 'Marking...' : 'Mark all Read'}
          </button>
        )}
      </header>

      <nav className="mb-4" aria-label="Notification filters">
        <NotificationFilterTabs active={filter} onChange={setFilter} />
      </nav>

      {isMutedTab ? (
        <MutedUsersList />
      ) : isLoading ? (
        <output
          className="flex flex-1 items-center justify-center"
          aria-busy="true"
        >
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </output>
      ) : isError ? (
        <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">
          Failed to load notifications. Please try again later.
        </p>
      ) : total === 0 ? (
        <NotificationEmptyState />
      ) : (
        <NotificationList
          notifications={notifications}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      )}
    </section>
  );
}
