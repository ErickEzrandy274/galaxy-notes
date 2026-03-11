import api from '@/lib/axios';
import type { UserProfile, SignedUploadUrlResponse } from '../types';

export async function fetchProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/users/me');
  return response.data;
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
}): Promise<UserProfile> {
  const response = await api.patch<UserProfile>('/users/me', data);
  return response.data;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<{ message: string }> {
  const response = await api.patch<{ message: string }>(
    '/users/me/password',
    data,
  );
  return response.data;
}

export async function createPhotoUploadUrl(
  fileName: string,
  mimeType: string,
  fileSize: number,
): Promise<SignedUploadUrlResponse> {
  const response = await api.post<SignedUploadUrlResponse>(
    '/users/me/photo-upload-url',
    { fileName, mimeType, fileSize },
  );
  return response.data;
}

export async function updatePhoto(
  photoUrl: string,
): Promise<{ photo: string }> {
  const response = await api.patch<{ photo: string }>('/users/me/photo', {
    photoUrl,
  });
  return response.data;
}

export async function removePhoto(): Promise<{ photo: null }> {
  const response = await api.delete<{ photo: null }>('/users/me/photo');
  return response.data;
}
