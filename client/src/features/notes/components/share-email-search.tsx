'use client';

import { useState, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Search, UserPlus, Check, X } from 'lucide-react';
import { useSearchUsers } from '../hooks/use-shares';
import type { PendingShareRecipient, UserSearchResult } from '../types';

const MAX_VISIBLE_CHIPS = 10;

function chipLabel(r: PendingShareRecipient): string {
  if (r.user) {
    const name = [r.user.firstName, r.user.lastName].filter(Boolean).join(' ');
    if (name) return name;
  }
  return r.email;
}

interface ShareEmailSearchProps {
  pendingRecipients: PendingShareRecipient[];
  serverEmails: string[];
  onAdd: (recipient: PendingShareRecipient) => void;
  onRemove: (email: string) => void;
  onAddMultiple: (recipients: PendingShareRecipient[]) => void;
  onRemoveMultiple: (emails: string[]) => void;
}

export function ShareEmailSearch({
  pendingRecipients,
  serverEmails,
  onAdd,
  onRemove,
  onAddMultiple,
  onRemoveMultiple,
}: ShareEmailSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data: users, isLoading } = useSearchUsers(query);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery('');
  };

  const allUsers = users ?? [];
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
  const pendingEmails = new Set(pendingRecipients.map((r) => r.email));

  const showInviteOption =
    isValidEmail &&
    !allUsers.some((u) => u.email === query) &&
    !serverEmails.includes(query) &&
    !pendingEmails.has(query);

  // Select All: only toggleable users (not already shared on server)
  const selectableUsers = allUsers.filter((u) => !serverEmails.includes(u.email));
  const selectedCount = selectableUsers.filter((u) => pendingEmails.has(u.email)).length;
  const allSelected = selectableUsers.length > 0 && selectedCount === selectableUsers.length;

  // "All Users" chip shows when current filter results are all selected
  const hasResults = query.length >= 2;
  const showAllUsersChip = hasResults && !isLoading && allSelected;

  // Chips: first 10 visible, rest in tooltip
  const visibleChips = pendingRecipients.slice(0, MAX_VISIBLE_CHIPS);
  const overflowChips = pendingRecipients.slice(MAX_VISIBLE_CHIPS);

  const handleToggle = (email: string, user?: UserSearchResult) => {
    if (serverEmails.includes(email)) return;
    if (pendingEmails.has(email)) {
      onRemove(email);
    } else {
      onAdd({ email, permission: 'READ', user: user ?? undefined });
    }
  };

  const handleSelectAllToggle = () => {
    if (allSelected) {
      // Deselect all from current filter
      onRemoveMultiple(selectableUsers.map((u) => u.email));
    } else {
      const unselected = selectableUsers.filter((u) => !pendingEmails.has(u.email));
      if (unselected.length === 0) return;
      onAddMultiple(
        unselected.map((u) => ({
          email: u.email,
          permission: 'READ' as const,
          user: u,
        })),
      );
    }
  };

  const handleInvite = () => {
    onAdd({ email: query, permission: 'READ' });
    setQuery('');
  };

  const handleClearAll = () => {
    onRemoveMultiple(pendingRecipients.map((r) => r.email));
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <div
          role="group"
          className="flex min-h-[42px] cursor-pointer flex-wrap items-center gap-1.5 rounded-lg border border-border bg-input px-3 py-2"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

          {/* "All Users" chip when every option in current filter is selected */}
          {pendingRecipients.length > 0 && showAllUsersChip && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-foreground"
              onPointerDown={(e) => e.stopPropagation()}
            >
              All Users
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="cursor-pointer rounded-full p-0.5 text-muted-foreground hover:bg-orange-500/20 hover:text-foreground"
                aria-label="Remove all users"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Individual chips (max 10 visible) */}
          {pendingRecipients.length > 0 &&
            !showAllUsersChip &&
            visibleChips.map((r) => (
              <span
                key={r.email}
                className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-foreground"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {chipLabel(r)}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(r.email);
                  }}
                  className="cursor-pointer rounded-full p-0.5 text-muted-foreground hover:bg-orange-500/20 hover:text-foreground"
                  aria-label={`Remove ${chipLabel(r)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

          {/* Overflow "+N more" with tooltip */}
          {!showAllUsersChip && overflowChips.length > 0 && (
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <span
                    className="inline-flex cursor-default items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    +{overflowChips.length} more
                  </span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="bottom"
                    sideOffset={6}
                    className="z-[70] max-w-xs rounded-lg border border-border bg-card px-3 py-2 shadow-lg"
                  >
                    <ul className="flex flex-wrap gap-1">
                      {overflowChips.map((r) => (
                        <li key={r.email}>
                          <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-foreground">
                            {chipLabel(r)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          )}

          <span className="text-sm text-muted-foreground">
            {pendingRecipients.length === 0 ? 'Search by name or email...' : 'Add more...'}
          </span>

          {/* Clear all */}
          {pendingRecipients.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="ml-auto cursor-pointer rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear all pending"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-[60] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            searchInputRef.current?.focus();
          }}
        >
          {/* Search input */}
          <label className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a name or email..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="cursor-pointer rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          {/* Results */}
          <div className="max-h-52 overflow-y-auto">
            {!hasResults && (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                Type at least 2 characters to search
              </p>
            )}

            {hasResults && isLoading && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>
            )}

            {hasResults && !isLoading && allUsers.length === 0 && !showInviteOption && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No users found</p>
            )}

            {/* Select All — always visible, toggles select/deselect */}
            {hasResults && !isLoading && selectableUsers.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllToggle}
                className="flex w-full cursor-pointer items-center gap-3 border-b border-border px-3 py-2 text-left text-sm font-medium hover:bg-muted"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    allSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}
                >
                  {allSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </span>
                <span className="text-foreground">
                  Select All ({selectableUsers.length})
                </span>
              </button>
            )}

            {/* User list */}
            {hasResults &&
              !isLoading &&
              allUsers.map((user) => {
                const isServer = serverEmails.includes(user.email);
                const isPending = pendingEmails.has(user.email);
                const isChecked = isServer || isPending;

                return (
                  <button
                    key={user.id}
                    type="button"
                    disabled={isServer}
                    onClick={() => handleToggle(user.email, user)}
                    className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isChecked ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 text-primary-foreground" />}
                    </span>
                    {user.photo ? (
                      <img src={user.photo} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {(user.firstName?.[0] ?? user.email[0]).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </span>
                    {isServer && (
                      <span className="text-xs text-muted-foreground">Already shared</span>
                    )}
                  </button>
                );
              })}

            {/* Invite by email */}
            {hasResults && !isLoading && showInviteOption && (
              <button
                type="button"
                onClick={handleInvite}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-muted-foreground" />
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                  <UserPlus className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-foreground">Send invite to {query}</span>
                  <span className="block text-xs text-muted-foreground">
                    User will be invited via email
                  </span>
                </span>
              </button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
