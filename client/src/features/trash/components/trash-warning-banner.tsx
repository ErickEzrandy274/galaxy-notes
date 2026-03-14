'use client';

import { AlertTriangle } from 'lucide-react';

interface TrashWarningBannerProps {
  retentionDays: number;
  onEmptyTrash: () => void;
  isEmptying?: boolean;
}

export function TrashWarningBanner({
  retentionDays,
  onEmptyTrash,
  isEmptying,
}: TrashWarningBannerProps) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-amber-400">
        <AlertTriangle size={16} className="shrink-0" />
        Notes in Trash are permanently deleted after {retentionDays} days.
      </span>
      <button
        type="button"
        onClick={onEmptyTrash}
        disabled={isEmptying}
        className="cursor-pointer rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isEmptying ? 'Emptying...' : 'Empty Trash'}
      </button>
    </div>
  );
}
