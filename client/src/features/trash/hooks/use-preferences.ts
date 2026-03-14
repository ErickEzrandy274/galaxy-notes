import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchPreferences, updatePreferences } from '../api/preferences-api';
import type { AutoDeleteBehavior } from '../types';

export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      trashRetentionDays?: number;
      autoDeleteBehavior?: AutoDeleteBehavior;
    }) => updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Preferences saved');
    },
  });
}
