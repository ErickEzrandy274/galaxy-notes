'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/schemas/auth';
import {
  AuthCard,
  AuthIcon,
  AuthHeader,
  AuthSubmitButton,
  FormInput,
  BackToLogin,
} from '@/features/auth';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const err = await response.json();
        toast.error(err.message || 'Something went wrong.');
        return;
      }

      router.push(`/reset-link-sent?email=${encodeURIComponent(data.email)}`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthIcon icon={KeyRound} variant="purple" />
      <AuthHeader
        title="Forgot Password?"
        subtitle="Enter your email and we'll send a reset link."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-6">
        <FormInput
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <AuthSubmitButton loading={isLoading}>
          Send Reset Link
        </AuthSubmitButton>
      </form>

      <BackToLogin />
    </AuthCard>
  );
}
