'use client';

import { useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AuthCard,
  AuthIcon,
  AuthHeader,
  CountdownTimer,
  BackToLogin,
} from '@/features/auth';
import { Suspense } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

function ResetLinkSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const handleResend = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const err = await response.json();
        toast.error(err.message || 'Failed to resend.');
        return;
      }

      toast.success('Reset link sent again!');
    } catch {
      toast.error('Failed to resend. Please try again.');
    }
  };

  return (
    <AuthCard>
      <AuthIcon icon={Mail} variant="green" />
      <AuthHeader
        title="Check your email"
        subtitle={
          <>
            We&apos;ve sent a password reset link to
            <br />
            <span className="font-semibold text-white">{email}</span>
          </>
        }
      />

      <p className="mt-4 text-center text-sm text-zinc-500">
        Click the link in the email to reset your password.
        <br />
        The link will expire in 15 minutes.
      </p>

      <footer className="mt-4">
        <CountdownTimer seconds={60} onResend={handleResend} />
      </footer>

      <BackToLogin />
    </AuthCard>
  );
}

export default function ResetLinkSentPage() {
  return (
    <Suspense>
      <ResetLinkSentContent />
    </Suspense>
  );
}
