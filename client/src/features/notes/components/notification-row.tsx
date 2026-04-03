'use client';

import { Link2, Pencil, Trash2, Bell, ShieldCheck, ShieldOff, LogOut, MoreHorizontal, RotateCcw, Archive, UserPlus, UserCheck, UserX } from 'lucide-react';
import { NotificationContextMenu } from './notification-context-menu';
import { useMarkNotificationRead } from '../hooks/use-notifications';
import { useRouter } from 'next/navigation';
import type { NotificationItem } from '../types';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'share':
      return {
        icon: Link2,
        bg: 'bg-purple-500/20',
        color: 'text-purple-400',
      };
    case 'permission_change':
      return {
        icon: ShieldCheck,
        bg: 'bg-blue-500/20',
        color: 'text-blue-400',
      };
    case 'edit':
      return {
        icon: Pencil,
        bg: 'bg-yellow-500/20',
        color: 'text-yellow-400',
      };
    case 'revoke':
      return {
        icon: ShieldOff,
        bg: 'bg-red-500/20',
        color: 'text-red-400',
      };
    case 'leave':
      return {
        icon: LogOut,
        bg: 'bg-red-500/20',
        color: 'text-red-400',
      };
    case 'restore':
      return {
        icon: RotateCcw,
        bg: 'bg-green-500/20',
        color: 'text-green-400',
      };
    case 'access_request':
      return {
        icon: UserPlus,
        bg: 'bg-indigo-500/20',
        color: 'text-indigo-400',
      };
    case 'access_declined':
      return {
        icon: UserPlus,
        bg: 'bg-red-500/20',
        color: 'text-red-400',
      };
    case 'access_granted':
      return {
        icon: UserCheck,
        bg: 'bg-green-500/20',
        color: 'text-green-400',
      };
    case 'access_declined_by_owner':
      return {
        icon: UserX,
        bg: 'bg-muted',
        color: 'text-muted-foreground',
      };
    case 'archive':
      return {
        icon: Archive,
        bg: 'bg-muted',
        color: 'text-muted-foreground',
      };
    case 'trash':
    case 'version_cleanup':
      return {
        icon: Trash2,
        bg: 'bg-muted',
        color: 'text-muted-foreground',
      };
    default:
      return {
        icon: Bell,
        bg: 'bg-orange-500/20',
        color: 'text-orange-400',
      };
  }
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay === 1) return '1 day ago';
  return `${diffDay} days ago`;
}

interface NotificationRowProps {
  notification: NotificationItem;
}

export function NotificationRow({ notification }: NotificationRowProps) {
  const { icon: Icon, bg, color } = getNotificationIcon(notification.type);
  const markRead = useMarkNotificationRead();
  const router = useRouter();

  const isNoteAvailableAgain =
    notification.type === 'restore' &&
    notification.title === 'Note Available Again';

  const isReadOnly =
    notification.isNoteAvailable === false || notification.type === 'leave' || notification.type === 'revoke' || notification.type === 'archive' || notification.type === 'trash' || notification.type === 'access_request' || notification.type === 'access_declined' || notification.type === 'access_granted' || notification.type === 'access_declined_by_owner' || isNoteAvailableAgain;

  const handleClick = () => {
    if (isReadOnly) return;

    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    if (notification.noteId) {
      // Recipients of shared notes navigate to /shared/ route
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

  return (
    <article
      onClick={isReadOnly ? undefined : handleClick}
      className={`group flex items-start gap-3 rounded-lg px-4 py-3 transition-colors ${
        isReadOnly
          ? 'cursor-default'
          : `cursor-pointer hover:bg-muted/50 ${notification.isRead ? '' : 'bg-primary/5'}`
      }`}
    >
      {/* Unread indicator */}
      <span className="flex w-2 shrink-0 items-center pt-4">
        {!notification.isRead && (
          <span className="h-2 w-2 rounded-full bg-blue-500" />
        )}
      </span>

      {/* Icon */}
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg}`}
      >
        <Icon size={18} className={color} />
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {notification.message}
        </p>
      </div>

      {/* Timestamp + menu */}
      <div
        className="flex shrink-0 items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <time className="text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </time>
        <NotificationContextMenu notification={notification}>
          <button className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <MoreHorizontal size={16} />
          </button>
        </NotificationContextMenu>
      </div>
    </article>
  );
}
