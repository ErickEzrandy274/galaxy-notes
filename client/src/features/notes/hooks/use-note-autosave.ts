'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createNote, updateNote } from '../api/notes-api';
import type { AutosaveStatus, NoteEditorData } from '../types';

const DEBOUNCE_MS = 2000;
const INTERVAL_MS = 120_000;
const STORAGE_PREFIX = 'note-draft-';

interface ConflictData {
  currentVersion: number;
}

interface UseNoteAutosaveOptions {
  data: NoteEditorData;
  isDirty: boolean;
  version: number;
  savedNoteId?: string;
  setSavedNoteId: (id: string) => void;
  markClean: (newVersion?: number) => void;
  contentTransform?: (content: string) => string;
  onConflict?: (conflict: ConflictData) => void;
}

export function useNoteAutosave({
  data,
  isDirty,
  version,
  savedNoteId,
  setSavedNoteId,
  markClean,
  contentTransform,
  onConflict,
}: UseNoteAutosaveOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const savingRef = useRef(false);
  const dataRef = useRef(data);
  const isDirtyRef = useRef(isDirty);
  const versionRef = useRef(version);
  const savedNoteIdRef = useRef(savedNoteId);
  const skipGuardRef = useRef(false);

  const contentTransformRef = useRef(contentTransform);
  dataRef.current = data;
  isDirtyRef.current = isDirty;
  versionRef.current = version;
  savedNoteIdRef.current = savedNoteId;
  contentTransformRef.current = contentTransform;

  const save = useCallback(async (snapshot = false) => {
    if (savingRef.current || !isDirtyRef.current) return;
    if (!dataRef.current.title.trim()) return;

    savingRef.current = true;
    setStatus('saving');

    const transform = contentTransformRef.current;
    const content = transform
      ? transform(dataRef.current.content)
      : dataRef.current.content;

    try {
      if (savedNoteIdRef.current) {
        const result = await updateNote(savedNoteIdRef.current, {
          title: dataRef.current.title,
          content,
          tags: dataRef.current.tags,
          document: dataRef.current.document,
          documentSize: dataRef.current.documentSize,
          videoUrl: dataRef.current.videoUrl || undefined,
          status: dataRef.current.status,
          version: versionRef.current,
          snapshot,
        });
        markClean(result.version);
      } else {
        const result = await createNote({
          title: dataRef.current.title,
          content,
          tags: dataRef.current.tags,
          document: dataRef.current.document ?? undefined,
          videoUrl: dataRef.current.videoUrl || undefined,
          status: dataRef.current.status,
        });
        setSavedNoteId(result.id);
        markClean(result.version);
        localStorage.removeItem(`${STORAGE_PREFIX}new`);
        skipGuardRef.current = true;
        router.replace(`/notes/${result.id}`);
      }

      setStatus('saved');
      setLastSavedAt(new Date());
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    } catch (error: any) {
      if (error?.response?.status === 409 && onConflict) {
        const conflictData = error.response?.data;
        onConflict({ currentVersion: conflictData?.currentVersion ?? version });
      }
      setStatus('error');
    } finally {
      savingRef.current = false;
    }
  }, [markClean, setSavedNoteId, router, queryClient]);

  // Debounce on change
  useEffect(() => {
    if (!isDirty) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(save, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [isDirty, data, save]);

  // 2-minute interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirtyRef.current) save();
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [save]);

  // localStorage fallback
  useEffect(() => {
    const interval = setInterval(() => {
      const key = `${STORAGE_PREFIX}${savedNoteIdRef.current ?? 'new'}`;
      localStorage.setItem(key, JSON.stringify(dataRef.current));
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Warn on browser close/refresh when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Warn on in-app navigation (intercept link clicks at capture phase)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirtyRef.current || skipGuardRef.current) return;

      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return;

      e.preventDefault();
      e.stopPropagation();
      pendingNavUrlRef.current = href;
      setShowLeaveDialog(true);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  const confirmLeave = useCallback(() => {
    setShowLeaveDialog(false);
    const url = pendingNavUrlRef.current;
    pendingNavUrlRef.current = null;
    if (url) {
      isDirtyRef.current = false;
      skipGuardRef.current = true;
      router.push(url);
    }
  }, [router]);

  const cancelLeave = useCallback(() => {
    setShowLeaveDialog(false);
    pendingNavUrlRef.current = null;
  }, []);

  // Manual save (for Save as Draft / Publish buttons)
  const saveNow = useCallback(
    async (overrideStatus?: string) => {
      // Cancel any pending debounce autosave to prevent duplicate version snapshots
      clearTimeout(debounceRef.current);

      // Wait for any in-progress autosave to finish so the new status isn't skipped
      while (savingRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (overrideStatus) {
        dataRef.current = { ...dataRef.current, status: overrideStatus as NoteEditorData['status'] };
      }
      isDirtyRef.current = true;
      skipGuardRef.current = true;
      await save(true);
    },
    [save],
  );

  return { status, lastSavedAt, saveNow, showLeaveDialog, confirmLeave, cancelLeave };
}
