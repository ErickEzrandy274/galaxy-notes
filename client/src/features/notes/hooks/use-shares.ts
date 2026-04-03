'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  fetchSharesForNote,
  addShares,
  updateSharePermission,
  removeShare,
  removeInvite,
  searchUsers,
  requestNoteAccess,
  grantNoteAccess,
  declineNoteAccess,
} from '../api/shares-api';

export function useShares(noteId: string) {
  return useQuery({
    queryKey: ['shares', noteId],
    queryFn: ({ signal }) => fetchSharesForNote(noteId, signal),
    enabled: !!noteId,
  });
}

export function useAddShares(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipients: Array<{ email: string; permission?: 'READ' | 'WRITE' }>) =>
      addShares({ noteId, recipients }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', noteId] });
      toast.success('Invitations sent successfully');
    },
    onError: () => {
      toast.error('Failed to send invitations');
    },
  });
}

export function useUpdateSharePermission(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, permission }: { shareId: string; permission: 'READ' | 'WRITE' }) =>
      updateSharePermission(shareId, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', noteId] });
    },
    onError: () => {
      toast.error('Failed to update permission');
    },
  });
}

export function useRemoveShare(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => removeShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', noteId] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Share removed');
    },
    onError: () => {
      toast.error('Failed to remove share');
    },
  });
}

export function useRemoveInvite(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => removeInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', noteId] });
      toast.success('Invite removed');
    },
    onError: () => {
      toast.error('Failed to remove invite');
    },
  });
}

export function useRequestNoteAccess() {
  return useMutation({
    mutationFn: (noteId: string) => requestNoteAccess(noteId),
    onSuccess: () => {
      toast.success('Access request sent to the note owner');
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to request access';
      toast.error(message);
    },
  });
}

export function useGrantNoteAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, userId, permission }: { noteId: string; userId: string; permission?: 'READ' | 'WRITE' }) =>
      grantNoteAccess(noteId, userId, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      toast.success('Access granted');
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to grant access';
      toast.error(message);
    },
  });
}

export function useDeclineNoteAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, userId }: { noteId: string; userId: string }) =>
      declineNoteAccess(noteId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Access request declined');
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to decline request';
      toast.error(message);
    },
  });
}

export function useSearchUsers(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['userSearch', debouncedQuery],
    queryFn: ({ signal }) => searchUsers(debouncedQuery, signal),
    enabled: debouncedQuery.length >= 2,
  });
}
