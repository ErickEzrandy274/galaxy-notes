'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import {
  AuthCard,
  AuthIcon,
  AuthHeader,
  AuthSubmitButton,
  PasswordInput,
} from '@/features/auth';
import api from '@/lib/axios';
import { Suspense, useState } from 'react';

const oauthLinkingSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type OAuthLinkingInput = z.infer<typeof oauthLinkingSchema>;

const providerLabels: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  facebook: 'Facebook',
};

const providerLetters: Record<string, string> = {
  google: 'G',
  github: 'GH',
  facebook: 'f',
};

function ProviderIcon({ provider }: { provider: string }) {
  return (
    <figure className="flex justify-center" aria-hidden="true">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 text-lg font-bold text-white">
        {providerLetters[provider] ?? provider.charAt(0).toUpperCase()}
      </span>
    </figure>
  );
}

function OAuthLinkingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider') ?? 'google';
  const email = searchParams.get('email') ?? '';
  const [isLoading, setIsLoading] = useState(false);

  const providerLabel = providerLabels[provider] ?? provider;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OAuthLinkingInput>({
    resolver: zodResolver(oauthLinkingSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (data: OAuthLinkingInput) => {
    setIsLoading(true);
    try {
      await api.post('/auth/link-oauth', {
        email,
        password: data.password,
        provider,
      });

      toast.success(`${providerLabel} account linked successfully!`);
      router.push('/login');
    } catch {
      // Axios interceptor shows error toast with request ID
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/login');
  };

  return (
    <AuthCard className="relative">
      <button
        type="button"
        onClick={handleCancel}
        className="absolute right-4 top-4 cursor-pointer text-zinc-500 transition-colors hover:text-zinc-300"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      <ProviderIcon provider={provider} />
      <AuthHeader
        title={`Link Your ${providerLabel} Account`}
        subtitle={
          <>
            An account with this email already exists.
            <br />
            Enter your password to link your {providerLabel} account.
          </>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <p className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5">
          <Mail size={16} className="text-zinc-500" aria-hidden="true" />
          <span className="text-sm text-zinc-300">{email}</span>
        </p>

        <label>
          <span className="block text-sm font-medium text-zinc-300">
            Password
          </span>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            {...register('password')}
            error={errors.password?.message}
          />
        </label>

        <AuthSubmitButton loading={isLoading}>
          Link Account
        </AuthSubmitButton>
      </form>

      <button
        type="button"
        onClick={handleCancel}
        className="mt-4 flex w-full cursor-pointer items-center justify-center text-sm text-zinc-400 transition-colors hover:text-zinc-300"
      >
        Cancel
      </button>
    </AuthCard>
  );
}

export default function OAuthLinkingPage() {
  return (
    <Suspense>
      <OAuthLinkingContent />
    </Suspense>
  );
}
