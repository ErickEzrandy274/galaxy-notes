'use client';

import { useEffect, useRef, useCallback } from 'react';
import { X, Loader2, History, Info, ArrowDown } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useVersionHistory } from '../hooks/use-version-history';
import { VersionHistoryItem } from './version-history-item';

interface VersionHistoryDrawerProps {
  noteId: string;
  currentUserId: string;
  open: boolean;
  viewingVersionId: string | null;
  onSelectVersion: (versionId: string | null) => void;
  onClose: () => void;
}

export function VersionHistoryDrawer({
  noteId,
  currentUserId,
  open,
  viewingVersionId,
  onSelectVersion,
  onClose,
}: VersionHistoryDrawerProps) {
  const {
    versions,
    totalVersions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useVersionHistory(noteId, open);

  const sentinelRef = useRef<HTMLLIElement>(null);

  // Infinite scroll via IntersectionObserver
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !open) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, handleIntersect]);

  const handleItemClick = (versionId: string, isCurrent: boolean) => {
    if (isCurrent) {
      onSelectVersion(null);
    } else {
      onSelectVersion(versionId);
    }
  };

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-l border-border bg-card transition-[width,opacity] duration-300 ease-in-out overflow-hidden ${
        open ? 'w-96 opacity-100' : 'w-0 opacity-0 border-l-0'
      }`}
    >
      <div className="flex h-full w-96 shrink-0 flex-col">
      <header className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Version History</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close version history"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <hr className="mt-3 border-border" />
      </header>

      <section className="flex-1 overflow-y-auto" aria-label="Version history list">
        {isLoading ? (
          <output className="flex items-center justify-center py-12" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </output>
        ) : versions.length === 0 ? (
          <figure className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <History className="h-8 w-8 text-muted-foreground/50" />
            <figcaption>
              <p className="text-sm text-muted-foreground">No version history yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Versions are created when published notes are updated
              </p>
            </figcaption>
          </figure>
        ) : (
          <ol className="list-none">
            <li className="flex items-center gap-1.5 px-4">
              <p className="text-xs font-semibold text-muted-foreground">
                {totalVersions} {totalVersions === 1 ? 'version' : 'versions'} found
              </p>
              <Tooltip.Provider delayDuration={200}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button type="button" aria-label="Version history info">
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="bottom"
                      align="center"
                      sideOffset={6}
                      className="version-history-tooltip z-50 w-72 rounded-md px-3 py-2 text-sm leading-relaxed shadow-lg"
                    >
                      A new version is saved each time a published note is updated. Restoring a version saves the current state first, so no data is lost. Up to 30 versions are kept.
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </li>
            {versions.map((version, index) => {
              const isCurrent = index === 0;
              return (
                <li key={version.id}>
                  <VersionHistoryItem
                    version={version}
                    isLast={index === versions.length - 1 && !hasNextPage}
                    isCurrent={isCurrent}
                    isOriginal={index === versions.length - 1 && !hasNextPage}
                    isViewing={version.id === viewingVersionId}
                    currentUserId={currentUserId}
                    onClick={() => handleItemClick(version.id, isCurrent)}
                  />
                </li>
              );
            })}

            {/* Sentinel for infinite scroll */}
            <li ref={sentinelRef} className="h-1" aria-hidden="true" />

            {isFetchingNextPage && (
              <li className="flex items-center justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </li>
            )}

            {hasNextPage && !isFetchingNextPage && (
              <li className="flex items-center justify-center gap-1.5 py-4 text-xs text-muted-foreground/70">
                <ArrowDown className="h-3 w-3" />
                Scroll for more versions
              </li>
            )}
          </ol>
        )}
      </section>
      </div>
    </aside>
  );
}
