'use client';

import { Check, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/primitives';
import type { AutosaveStatus } from '../types';

interface NoteAutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
}

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function NoteAutosaveIndicator({
  status,
  lastSavedAt,
}: NoteAutosaveIndicatorProps) {
  if (status === 'idle' && !lastSavedAt) return null;

  return (
    <output aria-live="polite" className="flex items-center gap-1.5 text-xs">
      {status === 'saving' && (
        <>
          <Spinner size="xs" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && lastSavedAt && (
        <>
          <Check className="h-3.5 w-3.5 text-green-400" />
          <span className="text-green-400">
            Auto-saved {getRelativeTime(lastSavedAt)}
          </span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3.5 w-3.5 text-red-400" />
          <span className="text-red-400">Save failed</span>
        </>
      )}
      {status === 'idle' && lastSavedAt && (
        <>
          <Check className="h-3.5 w-3.5 text-green-400" />
          <span className="text-green-400">
            Auto-saved {getRelativeTime(lastSavedAt)}
          </span>
        </>
      )}
    </output>
  );
}
