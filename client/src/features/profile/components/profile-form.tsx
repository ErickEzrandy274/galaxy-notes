'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { profileSchema, type ProfileInput } from '@/schemas/profile';
import type { UserProfile } from '../types';
import { useUpdateProfile } from '../hooks/use-profile';

interface ProfileFormProps {
  profile: UserProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { mutate, isPending } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      bio: profile.bio ?? '',
    },
  });

  useEffect(() => {
    reset({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      bio: profile.bio ?? '',
    });
  }, [profile, reset]);

  const onSubmit = (data: ProfileInput) => {
    mutate({ firstName: data.firstName, lastName: data.lastName, bio: data.bio || undefined });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <fieldset className="grid grid-cols-2 gap-4">
        <label>
          <span className="block text-sm font-medium text-foreground">
            First Name
          </span>
          <input
            id="firstName"
            type="text"
            className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="First name"
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </label>
        <label>
          <span className="block text-sm font-medium text-foreground">
            Last Name
          </span>
          <input
            id="lastName"
            type="text"
            className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Last name"
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </label>
      </fieldset>

      <label>
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          Email <Lock size={12} className="text-muted-foreground" />
        </span>
        <input
          id="email"
          type="email"
          value={profile.email}
          readOnly
          className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-border bg-muted px-4 py-2.5 text-muted-foreground opacity-70"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          * Email can only be changed via account security settings
        </p>
      </label>

      <label>
        <span className="block text-sm font-medium text-foreground">
          Bio
        </span>
        <textarea
          id="bio"
          rows={3}
          className="mt-1.5 w-full resize-none rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Tell us about yourself"
          {...register('bio')}
        />
      </label>

      <span className="flex gap-3">
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
      </span>
    </form>
  );
}
