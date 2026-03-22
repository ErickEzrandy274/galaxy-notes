'use client';

import { useState } from 'react';
import { X, Mail, Loader2, Trash2, Info } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useShares, useAddShares, useUpdateSharePermission, useRemoveShare, useRemoveInvite } from '../hooks/use-shares';
import { ShareEmailSearch } from './share-email-search';
import { SharePermissionSelect } from './share-permission-select';
import type { PendingShareRecipient } from '../types';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
}

export function ShareModal({ open, onClose, noteId, noteTitle }: ShareModalProps) {
  const [pendingRecipients, setPendingRecipients] = useState<PendingShareRecipient[]>([]);

  const { data: sharesData, isLoading } = useShares(noteId);
  const addSharesMutation = useAddShares(noteId);
  const updatePermissionMutation = useUpdateSharePermission(noteId);
  const removeShareMutation = useRemoveShare(noteId);
  const removeInviteMutation = useRemoveInvite(noteId);

  const serverEmails = [
    ...(sharesData?.shares.map((s) => s.user.email) ?? []),
    ...(sharesData?.pendingInvites.map((i) => i.email) ?? []),
  ];

  const handleAdd = (recipient: PendingShareRecipient) => {
    setPendingRecipients((prev) => [...prev, recipient]);
  };

  const handleRemove = (email: string) => {
    setPendingRecipients((prev) => prev.filter((r) => r.email !== email));
  };

  const handleUpdatePermission = (email: string, permission: 'READ' | 'WRITE') => {
    setPendingRecipients((prev) =>
      prev.map((r) => (r.email === email ? { ...r, permission } : r)),
    );
  };

  const handleAddMultiple = (recipients: PendingShareRecipient[]) => {
    setPendingRecipients((prev) => {
      const existing = new Set(prev.map((r) => r.email));
      const newOnes = recipients.filter((r) => !existing.has(r.email));
      return [...prev, ...newOnes];
    });
  };

  const handleRemoveMultiple = (emails: string[]) => {
    const toRemove = new Set(emails);
    setPendingRecipients((prev) => prev.filter((r) => !toRemove.has(r.email)));
  };

  const handleSubmit = async () => {
    if (pendingRecipients.length === 0) return;
    await addSharesMutation.mutateAsync(
      pendingRecipients.map((r) => ({ email: r.email, permission: r.permission })),
    );
    setPendingRecipients([]);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center${!open ? ' hidden' : ''}`} role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <article className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-border bg-card shadow-xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Share Note</h2>
            <p className="text-sm text-muted-foreground">{noteTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Combobox — outside scrollable so popover isn't clipped */}
        <div className="px-6 pt-4">
          <ShareEmailSearch
            pendingRecipients={pendingRecipients}
            serverEmails={serverEmails}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onAddMultiple={handleAddMultiple}
            onRemoveMultiple={handleRemoveMultiple}
          />
        </div>

        {/* Scrollable body — pending, shared, invites */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-2 space-y-5">
          {/* Pending recipients */}
          {pendingRecipients.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-400">
                Pending ({pendingRecipients.length})
              </h3>
              <ul className="space-y-2">
                {pendingRecipients.map((r) => (
                  <li key={r.email} className="flex items-center justify-between rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/10 text-xs font-medium text-orange-500">
                        {(r.user?.firstName?.[0] ?? r.email[0]).toUpperCase()}
                      </span>
                      <span>
                        <span className="flex items-center gap-1 text-sm text-foreground">
                          {r.user ? [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || r.email : r.email}
                          {!r.user && (
                            <Tooltip.Provider delayDuration={200}>
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <Info className="h-3.5 w-3.5 shrink-0 cursor-help text-orange-400" />
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="top"
                                    sideOffset={6}
                                    className="z-[70] max-w-xs rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-foreground shadow-lg"
                                  >
                                    You will share {noteTitle} with non-registered user
                                    <Tooltip.Arrow className="fill-orange-500/10" />
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            </Tooltip.Provider>
                          )}
                        </span>
                        {r.user && <span className="block text-xs text-muted-foreground">{r.email}</span>}
                      </span>
                    </div>
                    <span className="flex items-center gap-2">
                      <SharePermissionSelect
                        value={r.permission}
                        onChange={(p) => handleUpdatePermission(r.email, p)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemove(r.email)}
                        className="cursor-pointer rounded p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Existing shares + pending invites */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {(sharesData?.shares.length ?? 0) > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                    Shared With ({sharesData!.shares.length})
                  </h3>
                  <ul className="space-y-2">
                    {sharesData!.shares.map((share) => (
                      <li key={share.id} className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-medium text-emerald-500">
                            {(share.user.firstName?.[0] ?? share.user.email[0]).toUpperCase()}
                          </span>
                          <span>
                            <span className="block text-sm text-foreground">
                              {[share.user.firstName, share.user.lastName].filter(Boolean).join(' ') || share.user.email}
                            </span>
                            <span className="block text-xs text-muted-foreground">{share.user.email}</span>
                          </span>
                        </div>
                        <span className="flex items-center gap-2">
                          <SharePermissionSelect
                            value={share.permission}
                            onChange={(p) =>
                              updatePermissionMutation.mutate({ shareId: share.id, permission: p })
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeShareMutation.mutate(share.id)}
                            className="cursor-pointer rounded p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(sharesData?.pendingInvites.length ?? 0) > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
                    Pending Invites ({sharesData!.pendingInvites.length})
                  </h3>
                  <ul className="space-y-2">
                    {sharesData!.pendingInvites.map((invite) => (
                      <li key={invite.id} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-xs text-amber-500">
                            <Mail className="h-3.5 w-3.5" />
                          </span>
                          <span>
                            <span className="block text-sm text-foreground">{invite.email}</span>
                            <span className="block text-xs text-muted-foreground">Invite sent</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeInviteMutation.mutate(invite.id)}
                          className="cursor-pointer rounded p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {pendingRecipients.length > 0 && (
          <footer className="border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={addSharesMutation.isPending}
              className="w-full cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {addSharesMutation.isPending ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                `Invite ${pendingRecipients.length} user${pendingRecipients.length > 1 ? 's' : ''}`
              )}
            </button>
          </footer>
        )}
      </article>
    </div>
  );
}
