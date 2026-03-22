'use client';

import { Check } from 'lucide-react';
import type { ConnectedAccount as ConnectedAccountType } from '../types';

const providerConfig: Record<string, { label: string; color: string; icon: string }> = {
  google: { label: 'Google', color: 'text-red-500', icon: 'G' },
  github: { label: 'GitHub', color: 'text-foreground', icon: '⊙' },
  facebook: { label: 'Facebook', color: 'text-blue-600', icon: 'f' },
};

interface ConnectedAccountProps {
  account: ConnectedAccountType;
}

export function ConnectedAccount({ account }: ConnectedAccountProps) {
  const config = providerConfig[account.provider] ?? {
    label: account.provider,
    color: 'text-muted-foreground',
    icon: '?',
  };

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Connected Account
      </h2>
      <article className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <span className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold ${config.color}`}
          >
            {config.icon}
          </span>
          <span>
            <p className="text-sm font-medium text-foreground">
              {config.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {account.providerEmail}
            </p>
          </span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
          <Check size={14} />
          Connected
        </span>
      </article>
    </section>
  );
}
