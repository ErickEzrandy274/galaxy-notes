'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchProfile,
  updateProfile,
  changePassword as changePasswordApi,
  createPhotoUploadUrl,
  updatePhoto,
  removePhoto,
} from '../api/profile-api';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: ({ signal }) => fetchProfile(signal),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePasswordApi,
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
  });
}

export function usePhotoUpload() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const { signedUrl, token, path } = await createPhotoUploadUrl(
        file.name,
        file.type,
        file.size,
      );

      const res = await fetch(`${signedUrl}`, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          Authorization: `Bearer ${token}`,
        },
        body: file,
      });

      if (!res.ok) throw new Error('Upload failed');

      await updatePhoto(path);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Photo updated successfully');
    } catch (err: unknown) {
      // Only show toast for non-API errors (e.g. direct fetch to Supabase)
      // API errors are handled by the axios interceptor with request ID
      if (err instanceof Error && !(err as { isAxiosError?: boolean }).isAxiosError) {
        toast.error(err.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    try {
      await removePhoto();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Photo removed');
    } catch {
      // Axios interceptor shows error toast with request ID
    }
  };

  return { upload, remove, uploading };
}
