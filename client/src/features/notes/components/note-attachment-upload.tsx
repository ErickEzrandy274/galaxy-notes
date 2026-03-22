'use client';

import { useRef, useState, useCallback } from 'react';
import { Paperclip, FileText, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/primitives';
import { useNoteUpload } from '../hooks/use-note-upload';

interface NoteAttachmentUploadProps {
  document: string | null;
  onChange: (url: string | null, fileSize?: number | null) => void;
  noteId?: string;
  initialDocumentUrl?: string | null;
}

export function NoteAttachmentUpload({
  document,
  onChange,
  noteId,
  initialDocumentUrl,
}: NoteAttachmentUploadProps) {
  const { upload, isUploading, progress } = useNoteUpload(noteId ?? '', 'attachment');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploadedDownloadUrl, setUploadedDownloadUrl] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const result = await upload(file);
      if (result) {
        onChange(result.path, result.fileSize);
        setUploadedDownloadUrl(result.downloadUrl);
      }
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

  const fileName = document
    ? decodeURIComponent(
        document.split('?')[0].split('/').pop()?.replace(/^\d+_/, '') ?? 'attachment',
      )
    : null;

  const previewUrl = uploadedDownloadUrl ?? initialDocumentUrl;

  return (
    <section aria-label="Attachments">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Attachments
      </h3>

      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/50 p-6 transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-zinc-700/60 hover:border-muted-foreground'
        }`}
      >
        {isUploading ? (
          <output className="flex w-full flex-col items-center gap-3" aria-live="polite">
            <Spinner size="xl" />
            <figure className="w-full space-y-1">
              <progress
                value={progress}
                max={100}
                className="h-2 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-200"
              >
                {progress}%
              </progress>
              <figcaption className="text-center text-xs text-muted-foreground">
                Uploading... {progress}%
              </figcaption>
            </figure>
          </output>
        ) : (
          <>
            <section className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              {isDragOver ? (
                <FileText className="h-5 w-5 text-primary" />
              ) : (
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              )}
            </section>
            <p className="text-sm text-muted-foreground">
              {document ? 'Replace attachment' : 'Drop files or click to upload'}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              Max 3MB &middot; PDF File only
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
          className="hidden"
        />
      </label>

      {document && fileName && (
        <figure className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
          <span className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm text-foreground" title={fileName}>
              {fileName}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Preview attachment"
              >
                <Eye className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
              aria-label="Remove attachment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </span>
        </figure>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <article className="relative z-10 w-full max-w-[420px] rounded-xl border border-border bg-card p-6 shadow-xl">
            <header className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-foreground" />
              <h4 className="text-lg font-semibold text-foreground">
                Remove attachment?
              </h4>
            </header>
            <p className="mt-3 text-sm text-muted-foreground">
              This will remove the file from this note.
            </p>
            <footer className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 cursor-pointer rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(null, null);
                  setUploadedDownloadUrl(null);
                  setShowConfirm(false);
                }}
                className="flex-1 cursor-pointer rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </button>
            </footer>
          </article>
        </div>
      )}
    </section>
  );
}
