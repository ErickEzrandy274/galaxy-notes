'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'resend-countdown-expires-at';

function getRemaining(initialSeconds: number): number {
  if (typeof window === 'undefined') return initialSeconds;
  const expiresAt = localStorage.getItem(STORAGE_KEY);
  if (!expiresAt) return initialSeconds;
  const remaining = Math.ceil((Number(expiresAt) - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

export function useCountdown(initialSeconds: number) {
  const [timeLeft, setTimeLeft] = useState(() => getRemaining(initialSeconds));
  const [isActive, setIsActive] = useState(() => getRemaining(initialSeconds) > 0);

  // Set initial expiry on first visit (no existing entry)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing && timeLeft > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        String(Date.now() + initialSeconds * 1000),
      );
    }
  }, [initialSeconds, timeLeft]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsActive(false);
          localStorage.removeItem(STORAGE_KEY);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const reset = useCallback(() => {
    const expiresAt = Date.now() + initialSeconds * 1000;
    localStorage.setItem(STORAGE_KEY, String(expiresAt));
    setTimeLeft(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  return { timeLeft, isActive, reset };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface CountdownTimerProps {
  seconds: number;
  onResend: () => void;
}

export function CountdownTimer({ seconds, onResend }: CountdownTimerProps) {
  const { timeLeft, isActive, reset } = useCountdown(seconds);

  const handleResend = () => {
    onResend();
    reset();
  };

  return (
    <p className="block text-center text-sm text-zinc-400">
      Didn&apos;t receive the email?{' '}
      {isActive ? (
        <span className="text-zinc-500">
          Resend in {formatTime(timeLeft)}
        </span>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          className="font-medium text-purple-400 underline transition-colors hover:text-purple-300 cursor-pointer"
        >
          Resend
        </button>
      )}
    </p>
  );
}
