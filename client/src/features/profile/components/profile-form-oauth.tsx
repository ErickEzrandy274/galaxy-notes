'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { profileOAuthSchema, type ProfileOAuthInput } from '@/schemas/profile';
import type { UserProfile } from '../types';
import { useUpdateProfile } from '../hooks/use-profile';

const providerLabels: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  facebook: 'Facebook',
};

interface ProfileFormOAuthProps {
  profile: UserProfile;
}

export function ProfileFormOAuth({ profile }: ProfileFormOAuthProps) {
  const { mutate, isPending } = useUpdateProfile();
  const provider = profile.connectedAccount?.provider ?? '';
  const providerLabel = providerLabels[provider] ?? provider;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileOAuthInput>({
    resolver: zodResolver(profileOAuthSchema),
    defaultValues: {
      name: profile.name ?? '',
      bio: profile.bio ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: profile.name ?? '',
      bio: profile.bio ?? '',
    });
  }, [profile, reset]);

  const onSubmit = (data: ProfileOAuthInput) => {
    mutate({ name: data.name, bio: data.bio || undefined });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <label>
        <p className="block text-sm font-medium text-foreground">
          Full Name
        </p>
        <input
          id="fullName"
          type="text"
          className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Full name"
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </label>

      <label>
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          Email <Lock size={12} className="text-muted-foreground" />
        </p>
        <input
          id="email"
          type="email"
          value={profile.email}
          readOnly
          className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-border bg-muted px-4 py-2.5 text-muted-foreground opacity-70"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          * Email is managed by your {providerLabel} account!
        </p>
      </label>

      <label>
        <p className="block text-sm font-medium text-foreground">
          Bio
        </p>
        <textarea
          id="bio"
          rows={3}
          className="mt-1.5 w-full resize-none rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Tell us about yourself"
          {...register('bio')}
        />
      </label>

      <section className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="cursor-pointer rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          disabled={!isDirty}
          className="cursor-pointer rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </section>
    </form>
  );
}
