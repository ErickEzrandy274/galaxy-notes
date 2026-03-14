import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { restoreNote, permanentDeleteNote, emptyTrash } from '../api/trash-api';

export function useRestoreNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => restoreNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note restored as draft');
    },
  });
}

export function usePermanentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => permanentDeleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
      toast.success('Note permanently deleted');
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => emptyTrash(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success(`${data.deleted} note(s) permanently deleted`);
    },
  });
}
