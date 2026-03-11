'use client';

import { useRef } from 'react';
import { Camera } from 'lucide-react';
import type { UserProfile } from '../types';
import { usePhotoUpload } from '../hooks/use-profile';

const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const MAX_SIZE = 1 * 1024 * 1024; // 1MB

const providerLabels: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  facebook: 'Facebook',
};

const providerIcons: Record<string, { icon: string; color: string }> = {
  google: { icon: 'G', color: 'bg-red-500' },
  github: { icon: '⊙', color: 'bg-gray-700' },
  facebook: { icon: 'f', color: 'bg-blue-600' },
};

interface ProfileAvatarProps {
  profile: UserProfile;
}

export function ProfileAvatar({ profile }: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = usePhotoUpload();
  const isOAuth = profile.userType !== 'general_user';
  const provider = profile.connectedAccount?.provider;
  const providerLabel = provider ? providerLabels[provider] ?? provider : '';

  const initials = isOAuth
    ? (profile.name
        ?.split(/\s+/)
        .slice(0, 3)
        .map((w) => w.charAt(0))
        .join('')
        .toUpperCase() ?? 'U')
    : `${profile.firstName?.charAt(0) ?? ''}${profile.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'U';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Only .webp, .jpg, and .png files are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('File size exceeds 1MB limit.');
      return;
    }

    upload(file);
    e.target.value = '';
  };

  return (
    <figure className="flex flex-col items-center gap-3">
      <span className="relative block">
        {profile.photo ? (
          <img
            src={profile.photo}
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {initials}
          </span>
        )}

        {isOAuth && provider && providerIcons[provider] && (
          <span
            className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-xs font-bold text-white ${providerIcons[provider].color}`}
          >
            {providerIcons[provider].icon}
          </span>
        )}
      </span>

      {isOAuth ? (
        <figcaption className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Photo managed by {providerLabel}
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {provider && providerIcons[provider] && (
              <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${providerIcons[provider].color}`}>
                {providerIcons[provider].icon}
              </span>
            )}
            Connected via {providerLabel}
          </span>
        </figcaption>
      ) : (
        <figcaption className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera size={16} />
            {uploading ? 'Uploading...' : 'Change Photo'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".webp,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            General User
          </span>
        </figcaption>
      )}
    </figure>
  );
}
