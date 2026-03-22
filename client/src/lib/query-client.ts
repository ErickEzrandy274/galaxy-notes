import { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: (failureCount, error) => {
        // Never retry auth failures or canceled requests
        if ((error as { _authFailed?: boolean })._authFailed) return false;
        const status = (error as AxiosError)?.response?.status;
        if (status === 401 || status === 403) return false;
        if ((error as AxiosError)?.code === 'ERR_CANCELED') return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});
