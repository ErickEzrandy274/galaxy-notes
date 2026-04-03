'use client';

import { Bell } from 'lucide-react';

export function NotificationEmptyState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Bell size={32} className="text-muted-foreground" />
      </span>
      <h2 className="text-xl font-semibold text-foreground">
        No notifications yet
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        When someone shares a note with you or makes changes to a shared note,
        you&apos;ll see notifications here.
      </p>
    </section>
  );
}
