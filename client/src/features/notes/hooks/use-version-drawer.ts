'use client';

import { useState, useCallback } from 'react';

const MD_BREAKPOINT = '(min-width: 768px)';

export function useVersionDrawer() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);

  const openHistory = useCallback(() => setHistoryOpen(true), []);

  const handleCloseHistory = useCallback(() => {
    setHistoryOpen(false);
    setViewingVersionId(null);
  }, []);

  const handleBackToCurrent = useCallback(() => {
    setViewingVersionId(null);
  }, []);

  const handleSelectVersion = useCallback((versionId: string | null) => {
    setViewingVersionId(versionId);
    if (versionId && !window.matchMedia(MD_BREAKPOINT).matches) {
      setHistoryOpen(false);
    }
  }, []);

  return {
    historyOpen,
    viewingVersionId,
    openHistory,
    handleSelectVersion,
    handleCloseHistory,
    handleBackToCurrent,
  };
}
