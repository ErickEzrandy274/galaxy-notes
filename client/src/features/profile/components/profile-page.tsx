'use client';

import { useProfile } from '../hooks/use-profile';
import { ProfileAvatar } from './profile-avatar';
import { ProfileForm } from './profile-form';
import { ProfileFormOAuth } from './profile-form-oauth';
import { ChangePasswordForm } from './change-password-form';
import { ConnectedAccount } from './connected-account';

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <article className="mx-auto max-w-2xl px-6 py-10" aria-busy="true">
        <section className="animate-pulse space-y-6">
          <span className="block h-8 w-40 rounded bg-muted" />
          <figure className="flex flex-col items-center gap-3">
            <span className="block h-24 w-24 rounded-full bg-muted" />
            <span className="block h-8 w-32 rounded bg-muted" />
          </figure>
          <fieldset className="grid grid-cols-2 gap-4">
            <span className="block h-16 rounded bg-muted" />
            <span className="block h-16 rounded bg-muted" />
          </fieldset>
          <span className="block h-16 rounded bg-muted" />
          <span className="block h-24 rounded bg-muted" />
        </section>
      </article>
    );
  }

  if (!profile) return null;

  const isOAuth = profile.userType !== 'general_user';

  return (
    <article className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-bold text-foreground">My Profile</h1>

      <ProfileAvatar profile={profile} />

      <section className="mt-8">
        {isOAuth ? (
          <ProfileFormOAuth profile={profile} />
        ) : (
          <ProfileForm profile={profile} />
        )}
      </section>

      {!isOAuth && <ChangePasswordForm />}

      {isOAuth && profile.connectedAccount && (
        <ConnectedAccount account={profile.connectedAccount} />
      )}
    </article>
  );
}
