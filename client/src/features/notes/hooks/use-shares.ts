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
} from '../api/shares-api';

export function useShares(noteId: string) {
  return useQuery({
    queryKey: ['shares', noteId],
    queryFn: () => fetchSharesForNote(noteId),
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

export function useSearchUsers(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['userSearch', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });
}
