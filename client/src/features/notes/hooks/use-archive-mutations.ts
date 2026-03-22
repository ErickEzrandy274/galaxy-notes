'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { archiveNote, unarchiveNote } from '../api/notes-api';

export function useArchiveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => archiveNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUnarchiveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => unarchiveNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note unarchived successfully');
    },
  });
}
