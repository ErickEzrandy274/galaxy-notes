import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// --- In-memory token cache ---

let cachedToken: string | null = null;
let tokenExpiry = 0;
let refreshPromise: Promise<string | null> | null = null;

function decodeTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}

export function setAccessToken(token: string) {
  cachedToken = token;
  tokenExpiry = decodeTokenExpiry(token);
}

export function clearAccessToken() {
  cachedToken = null;
  tokenExpiry = 0;
}

function isTokenExpiringSoon(): boolean {
  if (!cachedToken || !tokenExpiry) return false;
  return tokenExpiry - Date.now() < 5 * 60 * 1000;
}

async function refreshToken(): Promise<string | null> {
  if (!cachedToken) return null;

  try {
    const baseURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const response = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${cachedToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const newToken = response.data.accessToken;
    setAccessToken(newToken);
    return newToken;
  } catch {
    clearAccessToken();
    return null;
  }
}

// --- Request interceptor: attach token + proactive refresh ---

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Hydrate from NextAuth session if no cached token
    if (!cachedToken && typeof window !== 'undefined') {
      try {
        const session = await getSession();
        if (session?.accessToken) {
          setAccessToken(session.accessToken);
        }
      } catch {
        // Session not available
      }
    }

    // Proactive refresh if token is about to expire
    if (cachedToken && isTokenExpiringSoon()) {
      if (!refreshPromise) {
        refreshPromise = refreshToken().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
    }

    // Attach token to request
    if (cachedToken) {
      config.headers.Authorization = `Bearer ${cachedToken}`;
    }

    return config;
  },
);

// --- Response interceptor: retry on 401 with refreshed token + request-id error toast ---

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry once on 401 with a refreshed token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // Refresh failed — redirect to login
      clearAccessToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Attach request-id to the error for callers
    const requestId = error.response?.headers?.['x-request-id'];
    if (requestId) {
      error.requestId = requestId;
    }

    // Show error toast with request-id (skip during 401 retry)
    if (!originalRequest._retry && typeof window !== 'undefined') {
      const message =
        error.response?.data?.message || 'Something went wrong';
      const refSuffix = requestId ? ` (Ref: ${requestId})` : '';
      toast.error(`${message}${refSuffix}`);
    }

    return Promise.reject(error);
  },
);

export default api;
