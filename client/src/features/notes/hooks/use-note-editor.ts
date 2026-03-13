'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNote } from '../api/notes-api';
import type { NoteEditorData, NoteStatus } from '../types';

const EMPTY_EDITOR: NoteEditorData = {
  title: '',
  content: '',
  tags: [],
  document: null,
  documentSize: null,
  videoUrl: '',
  status: 'draft' as NoteStatus,
};

export function useNoteEditor(noteId?: string) {
  const [data, setData] = useState<NoteEditorData>(EMPTY_EDITOR);
  const [isDirty, setIsDirty] = useState(false);
  const [version, setVersion] = useState(1);
  const [savedNoteId, setSavedNoteId] = useState<string | undefined>(noteId);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const { isLoading } = useQuery({
    queryKey: ['note', noteId],
    queryFn: () => fetchNote(noteId!),
    enabled: !!noteId,
    select: (note) => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        setData({
          title: note.title,
          content: note.content ?? '',
          tags: note.tags,
          document: note.document ?? null,
          documentSize: note.documentSize ?? null,
          videoUrl: note.videoUrl ?? '',
          status: note.status,
        });
        setDocumentUrl(note.documentUrl ?? null);
        setVersion(note.version);
        setSavedNoteId(note.id);
      }
      return note;
    },
  });

  const updateField = useCallback(
    <K extends keyof NoteEditorData>(field: K, value: NoteEditorData[K]) => {
      setData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    [],
  );

  const markClean = useCallback((newVersion?: number) => {
    setIsDirty(false);
    if (newVersion !== undefined) setVersion(newVersion);
  }, []);

  return {
    data,
    isDirty,
    version,
    savedNoteId,
    setSavedNoteId,
    isLoading: noteId ? isLoading : false,
    updateField,
    markClean,
    documentUrl,
  };
}
