'use client';

import { useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { isTokenExpiringSoon, setAccessToken } from '@/lib/axios';

const CHECK_INTERVAL_MS = 10 * 60 * 1000;

export function useTokenRefresh() {
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isTokenExpiringSoon()) return;

      const session = await getSession();
      if (session?.accessToken) {
        setAccessToken(session.accessToken);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
