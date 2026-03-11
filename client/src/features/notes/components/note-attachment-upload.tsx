'use client';

import { useRef, useState, useCallback } from 'react';
import { Paperclip, X, Loader2, ImageIcon } from 'lucide-react';
import { useNoteUpload } from '../hooks/use-note-upload';

interface NoteAttachmentUploadProps {
  photo: string | null;
  onChange: (url: string | null) => void;
}

export function NoteAttachmentUpload({
  photo,
  onChange,
}: NoteAttachmentUploadProps) {
  const { upload, isUploading } = useNoteUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const url = await upload(file);
      if (url) onChange(url);
    },
    [upload, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <section aria-label="Attachments">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Attachments
      </h3>

      {photo ? (
        <figure className="group relative overflow-hidden rounded-lg border border-border">
          <img
            src={photo}
            alt="Note attachment"
            className="h-40 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </figure>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground'
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Uploading...
              </span>
            </>
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {isDragOver ? (
                  <ImageIcon className="h-5 w-5 text-primary" />
                ) : (
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                )}
              </span>
              <span className="text-sm text-muted-foreground">
                Drop files or click to upload
              </span>
              <span className="text-xs text-muted-foreground">
                Max 1MB &middot; .webp, .jpg, .png
              </span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".webp,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
            className="hidden"
          />
        </label>
      )}
    </section>
  );
}
