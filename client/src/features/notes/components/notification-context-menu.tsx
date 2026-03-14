'use client';

import { Eye, CheckSquare, BellOff, Trash2, ChevronRight, UserPlus, UserCheck, UserX } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  useMarkNotificationRead,
  useDeleteNotification,
  useMuteUser,
} from '../hooks/use-notifications';
import { useRequestNoteAccess, useGrantNoteAccess, useDeclineNoteAccess } from '../hooks/use-shares';
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
  const requestAccess = useRequestNoteAccess();
  const grantAccess = useGrantNoteAccess();
  const declineAccess = useDeclineNoteAccess();

  const isNoteAvailableAgain =
    notification.type === 'restore' &&
    notification.title === 'Note Available Again';

  const isAccessRequest = notification.type === 'access_request';

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

  const handleRequestAccess = () => {
    if (notification.noteId) {
      if (!notification.isRead) {
        markRead.mutate(notification.id);
      }
      requestAccess.mutate(notification.noteId);
    }
  };

  const handleGrantAccess = (permission: 'READ' | 'WRITE') => {
    if (notification.noteId && notification.actorId) {
      if (!notification.isRead) {
        markRead.mutate(notification.id);
      }
      grantAccess.mutate({
        noteId: notification.noteId,
        userId: notification.actorId,
        permission,
      });
    }
  };

  const handleDeclineAccess = () => {
    if (notification.noteId && notification.actorId) {
      if (!notification.isRead) {
        markRead.mutate(notification.id);
      }
      declineAccess.mutate({
        noteId: notification.noteId,
        userId: notification.actorId,
      });
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
          {isAccessRequest && notification.noteId && notification.actorId && (
            <>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-green-500 outline-none hover:bg-muted data-[state=open]:bg-muted">
                  <UserCheck size={14} />
                  Grant Access
                  <ChevronRight size={14} className="ml-auto" />
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent
                    sideOffset={4}
                    className="z-50 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg"
                  >
                    <DropdownMenu.Item
                      onSelect={() => handleGrantAccess('READ')}
                      disabled={grantAccess.isPending}
                      className={itemClass}
                    >
                      Can View
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => handleGrantAccess('WRITE')}
                      disabled={grantAccess.isPending}
                      className={itemClass}
                    >
                      Can Edit
                    </DropdownMenu.Item>
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
              <DropdownMenu.Item
                onSelect={handleDeclineAccess}
                disabled={declineAccess.isPending}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 outline-none hover:bg-muted"
              >
                <UserX size={14} />
                Decline
              </DropdownMenu.Item>
            </>
          )}

          {isNoteAvailableAgain && notification.noteId && (
            <DropdownMenu.Item
              onSelect={handleRequestAccess}
              disabled={requestAccess.isPending}
              className={itemClass}
            >
              <UserPlus size={14} />
              Request Access
            </DropdownMenu.Item>
          )}

          {!isNoteAvailableAgain && !isAccessRequest && notification.noteId && notification.isNoteAvailable !== false && notification.type !== 'leave' && notification.type !== 'revoke' && notification.type !== 'archive' && notification.type !== 'trash' && notification.type !== 'access_granted' && notification.type !== 'access_declined_by_owner' && (
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
