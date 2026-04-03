'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSession, signOut } from 'next-auth/react';
import { isTokenExpiringSoon, setAccessToken, logout } from '@/lib/axios';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useTokenRefresh() {
  const refreshingRef = useRef(false);

  const refreshIfNeeded = useCallback(async () => {
    if (refreshingRef.current) return;
    if (!isTokenExpiringSoon()) return;

    refreshingRef.current = true;
    try {
      // getSession() triggers the NextAuth JWT callback server-side,
      // which performs the actual refresh via X-Refresh-Token header
      const session = await getSession();

      if (session?.error === 'RefreshTokenError' || session?.error === 'SessionExpired') {
        // NextAuth refresh failed — session is stale, force sign out
        await logout();
        signOut({ callbackUrl: '/login' });
        return;
      }

      if (session?.accessToken) {
        setAccessToken(session.accessToken);
      }
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. Periodic check (active tab)
    const interval = setInterval(refreshIfNeeded, CHECK_INTERVAL_MS);

    // 2. Visibility change — fires when tab becomes visible again
    //    (solves browser throttling of setInterval in background tabs)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshIfNeeded();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 3. Window focus — fires on alt-tab back
    const onFocus = () => refreshIfNeeded();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshIfNeeded]);
}
