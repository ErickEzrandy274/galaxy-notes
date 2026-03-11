'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { createSignedUploadUrl } from '../api/notes-api';

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png'];

export function useNoteUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (file: File): Promise<string | null> => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only .webp, .jpg, and .png files are allowed.');
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 1MB limit.');
      return null;
    }

    setIsUploading(true);
    try {
      const { signedUrl, publicUrl } = await createSignedUploadUrl(
        file.name,
        file.type,
        file.size,
      );

      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      return publicUrl;
    } catch {
      toast.error('Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading };
}
