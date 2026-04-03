'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { usePreferences, useUpdatePreferences } from '../hooks/use-preferences';
import type { AutoDeleteBehavior } from '../types';

const RETENTION_OPTIONS = [7, 14, 30] as const;

const BEHAVIOR_OPTIONS: { value: AutoDeleteBehavior; label: string }[] = [
  { value: 'delete_note_and_versions', label: 'Delete notes and version history' },
  { value: 'delete_versions_only', label: 'Delete version history only' },
];

export function TrashSettingsPopover() {
  const { data: prefs } = usePreferences();
  const updateMutation = useUpdatePreferences();

  const [retentionDays, setRetentionDays] = useState(30);
  const [behavior, setBehavior] = useState<AutoDeleteBehavior>('delete_versions_only');
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && prefs) {
      setRetentionDays(prefs.trashRetentionDays);
      setBehavior(prefs.autoDeleteBehavior);
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    updateMutation.mutate(
      { trashRetentionDays: retentionDays, autoDeleteBehavior: behavior },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          aria-label="Trash settings"
        >
          <Settings size={16} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-lg border border-border bg-card p-4 shadow-lg"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Trash Settings
          </h3>

          <fieldset className="mb-4">
            <legend className="mb-2 text-xs font-medium text-muted-foreground">
              Auto-delete period
            </legend>
            <div className="flex flex-col gap-1.5">
              {RETENTION_OPTIONS.map((days) => (
                <label
                  key={days}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                >
                  <input
                    type="radio"
                    name="retentionDays"
                    value={days}
                    checked={retentionDays === days}
                    onChange={() => setRetentionDays(days)}
                    className="accent-primary"
                  />
                  {days} days
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="mb-2 text-xs font-medium text-muted-foreground">
              Cleanup behavior
            </legend>
            <div className="flex flex-col gap-1.5">
              {BEHAVIOR_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                >
                  <input
                    type="radio"
                    name="behavior"
                    value={opt.value}
                    checked={behavior === opt.value}
                    onChange={() => setBehavior(opt.value)}
                    className="accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </button>

          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
