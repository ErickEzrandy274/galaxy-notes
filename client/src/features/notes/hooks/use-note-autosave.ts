'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createNote, updateNote } from '../api/notes-api';
import type { AutosaveStatus, NoteEditorData } from '../types';

const DEBOUNCE_MS = 2000;
const INTERVAL_MS = 30_000;
const STORAGE_PREFIX = 'note-draft-';

interface UseNoteAutosaveOptions {
  data: NoteEditorData;
  isDirty: boolean;
  version: number;
  savedNoteId?: string;
  setSavedNoteId: (id: string) => void;
  markClean: (newVersion?: number) => void;
}

export function useNoteAutosave({
  data,
  isDirty,
  version,
  savedNoteId,
  setSavedNoteId,
  markClean,
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

  dataRef.current = data;
  isDirtyRef.current = isDirty;
  versionRef.current = version;
  savedNoteIdRef.current = savedNoteId;

  const save = useCallback(async () => {
    if (savingRef.current || !isDirtyRef.current) return;
    if (!dataRef.current.title.trim()) return;

    savingRef.current = true;
    setStatus('saving');

    try {
      if (savedNoteIdRef.current) {
        const result = await updateNote(savedNoteIdRef.current, {
          title: dataRef.current.title,
          content: dataRef.current.content,
          tags: dataRef.current.tags,
          photo: dataRef.current.photo ?? undefined,
          videoUrl: dataRef.current.videoUrl || undefined,
          status: dataRef.current.status,
          version: versionRef.current,
        });
        markClean(result.version);
      } else {
        const result = await createNote({
          title: dataRef.current.title,
          content: dataRef.current.content,
          tags: dataRef.current.tags,
          photo: dataRef.current.photo ?? undefined,
          videoUrl: dataRef.current.videoUrl || undefined,
          status: dataRef.current.status,
        });
        setSavedNoteId(result.id);
        markClean(result.version);
        localStorage.removeItem(`${STORAGE_PREFIX}new`);
        router.replace(`/notes/${result.id}`);
      }

      setStatus('saved');
      setLastSavedAt(new Date());
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    } catch {
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

  // 30s interval
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

  // Manual save (for Save as Draft / Publish buttons)
  const saveNow = useCallback(
    async (overrideStatus?: string) => {
      if (overrideStatus) {
        dataRef.current = { ...dataRef.current, status: overrideStatus as NoteEditorData['status'] };
      }
      isDirtyRef.current = true;
      await save();
    },
    [save],
  );

  return { status, lastSavedAt, saveNow };
}
