'use client';

import { Eye, CheckSquare, BellOff, Trash2, ChevronRight } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  useMarkNotificationRead,
  useDeleteNotification,
  useMuteUser,
} from '../hooks/use-notifications';
import type { NotificationItem, MuteDuration } from '../types';

const MUTE_OPTIONS: { label: string; duration: MuteDuration }[] = [
  { label: 'For 1 hour', duration: '1h' },
  { label: 'For 1 day', duration: '1d' },
  { label: 'For 1 week', duration: '1w' },
  { label: 'Forever', duration: 'forever' },
];

interface NotificationContextMenuProps {
  notification: NotificationItem;
  children: React.ReactNode;
}

export function NotificationContextMenu({
  notification,
  children,
}: NotificationContextMenuProps) {
  const router = useRouter();
  const markRead = useMarkNotificationRead();
  const deleteNotif = useDeleteNotification();
  const muteUserMutation = useMuteUser();

  const handleViewNote = () => {
    if (notification.noteId) {
      if (!notification.isRead) {
        markRead.mutate(notification.id);
      }
      const isSharedRecipient =
        notification.type === 'permission_change' ||
        (notification.type === 'share' &&
          notification.title === 'Note Shared With You');

      let href: string;
      if (isSharedRecipient) {
        href = `/shared/${notification.noteId}`;
      } else if (notification.type === 'version_cleanup') {
        href = `/trash/${notification.noteId}`;
      } else {
        href = `/notes/${notification.noteId}`;
      }
      router.push(href);
    }
  };

  const handleMarkAsRead = () => {
    markRead.mutate(notification.id);
  };

  const handleMuteUser = (duration: MuteDuration) => {
    if (notification.actorId) {
      muteUserMutation.mutate(
        { userId: notification.actorId, duration },
        {
          onSuccess: () => {
            const name = notification.actor
              ? [notification.actor.firstName, notification.actor.lastName]
                  .filter(Boolean)
                  .join(' ') || notification.actor.email
              : 'User';
            toast.success(`Muted notifications from ${name}`);
          },
        },
      );
    }
  };

  const handleRemove = () => {
    deleteNotif.mutate(notification.id);
  };

  const itemClass =
    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none hover:bg-muted';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {notification.noteId && notification.isNoteAvailable !== false && notification.type !== 'leave' && notification.type !== 'revoke' && notification.type !== 'archive' && notification.type !== 'trash' && (
            <DropdownMenu.Item onSelect={handleViewNote} className={itemClass}>
              <Eye size={14} />
              View note
            </DropdownMenu.Item>
          )}

          {!notification.isRead && (
            <DropdownMenu.Item
              onSelect={handleMarkAsRead}
              className={itemClass}
            >
              <CheckSquare size={14} />
              Mark as read
            </DropdownMenu.Item>
          )}

          {notification.actorId && (
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-amber-500 outline-none hover:bg-muted data-[state=open]:bg-muted">
                <BellOff size={14} />
                Mute this user
                <ChevronRight size={14} className="ml-auto" />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  sideOffset={4}
                  className="z-50 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg"
                >
                  {MUTE_OPTIONS.map(({ label, duration }) => (
                    <DropdownMenu.Item
                      key={duration}
                      onSelect={() => handleMuteUser(duration)}
                      className={itemClass}
                    >
                      {label}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={handleRemove}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
          >
            <Trash2 size={14} />
            Remove notification
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
