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
    queryFn: fetchProfile,
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
      const { signedUrl, token, publicUrl } = await createPhotoUploadUrl(
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

      await updatePhoto(publicUrl);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Photo updated successfully');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Photo upload failed';
      toast.error(message);
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
      toast.error('Failed to remove photo');
    }
  };

  return { upload, remove, uploading };
}
