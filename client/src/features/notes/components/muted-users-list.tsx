'use client';

import { BellOff, Volume2 } from 'lucide-react';
import { Spinner, Button } from '@/components/primitives';
import toast from 'react-hot-toast';
import { useMutedUsers, useUnmuteUser } from '../hooks/use-notifications';

function formatMuteExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'Muted forever';
  const date = new Date(expiresAt);
  return `Muted until ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

export function MutedUsersList() {
  const { data: mutedUsers, isLoading } = useMutedUsers();
  const unmuteMutation = useUnmuteUser();

  const handleUnmute = (mutedUserId: string, name: string) => {
    unmuteMutation.mutate(mutedUserId, {
      onSuccess: () => {
        toast.success(`Unmuted ${name}`);
      },
    });
  };

  if (isLoading) {
    return (
      <output
        className="flex flex-1 items-center justify-center"
        aria-busy="true"
      >
        <Spinner size="xl" />
      </output>
    );
  }

  if (!mutedUsers || mutedUsers.length === 0) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Volume2 size={32} className="text-muted-foreground" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">
          No muted users
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          When you mute a user, their notifications will be hidden. You can
          manage muted users here.
        </p>
      </section>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {mutedUsers.map((mute) => {
        const user = mute.mutedUser;
        const displayName =
          [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          user.email;

        return (
          <li
            key={mute.id}
            className="flex items-center gap-4 px-4 py-3"
          >
            {/* Avatar */}
            {user.photo ? (
              <img
                src={user.photo}
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {(user.firstName?.[0] || user.email[0]).toUpperCase()}
              </span>
            )}

            {/* Info */}
            <span className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-500">
                <BellOff size={12} />
                {formatMuteExpiry(mute.expiresAt)}
              </p>
            </span>

            {/* Unmute button */}
            <Button variant="outline" size="sm" onClick={() => handleUnmute(user.id, displayName)} disabled={unmuteMutation.isPending}>
              Unmute
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
