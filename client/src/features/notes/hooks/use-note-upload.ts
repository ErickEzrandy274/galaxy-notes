'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { createSignedUploadUrl } from '../api/notes-api';

const MAX_FILE_SIZE_EDITOR = 1 * 1024 * 1024;
const MAX_FILE_SIZE_ATTACHMENT = 3 * 1024 * 1024;
const ALLOWED_TYPES_EDITOR = ['image/webp', 'image/jpeg', 'image/png'];
const ALLOWED_TYPES_ATTACHMENT = ['application/pdf'];

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.send(file);
  });
}

export function useNoteUpload(noteId: string, source: 'rich-text-editor' | 'attachment') {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (
    file: File,
  ): Promise<{ path: string; downloadUrl: string | null; fileSize: number } | null> => {
    const allowedTypes =
      source === 'attachment' ? ALLOWED_TYPES_ATTACHMENT : ALLOWED_TYPES_EDITOR;
    const maxSize =
      source === 'attachment' ? MAX_FILE_SIZE_ATTACHMENT : MAX_FILE_SIZE_EDITOR;

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        source === 'attachment'
          ? 'Only .pdf files are allowed.'
          : 'Only .webp, .jpg, and .png files are allowed.',
      );
      return null;
    }
    if (file.size > maxSize) {
      toast.error(
        `File size exceeds ${source === 'attachment' ? '3MB' : '1MB'} limit.`,
      );
      return null;
    }

    setIsUploading(true);
    setProgress(0);
    try {
      const { signedUrl, path, downloadUrl } = await createSignedUploadUrl(
        noteId,
        file.name,
        file.type,
        file.size,
        source,
      );

      await uploadWithProgress(signedUrl, file, setProgress);

      return { path, downloadUrl, fileSize: file.size };
    } catch (error: unknown) {
      // Only show toast for non-API errors (e.g. direct fetch to Supabase)
      // API errors are handled by the axios interceptor with request ID
      if (!(error as { isAxiosError?: boolean })?.isAxiosError) {
        toast.error('Failed to upload file. Please try again.');
      }
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return { upload, isUploading, progress };
}
