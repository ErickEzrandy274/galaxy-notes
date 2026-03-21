'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Spinner, Button } from '@/components/primitives';
import { PageHeader } from '@/components/shared/page-header';
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
      <PageHeader
        icon={Bell}
        iconColorClass="bg-orange-500/10 text-orange-500"
        title="Notifications"
        action={
          hasUnread && !isMutedTab ? (
            <Button variant="ghost-primary" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending} loadingText="Marking...">
              Mark all Read
            </Button>
          ) : undefined
        }
      />

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
          <Spinner size="xl" />
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
