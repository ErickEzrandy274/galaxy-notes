'use client';

import { useRef, useCallback, useMemo, useEffect, type MutableRefObject } from 'react';
import dynamic from 'next/dynamic';
import { NoteTagsCombobox } from './note-tags-combobox';
import { useNoteUpload } from '../hooks/use-note-upload';
import type { NoteEditorData } from '../types';

const QuillEditor = dynamic(() => import('./quill-editor'), { ssr: false });

const QUILL_EMPTY = '<p><br></p>';
const CORRUPTED_IMG = /\/\/:0/;

function isEmptyContent(html: string): boolean {
  return !html || html === QUILL_EMPTY;
}

interface NoteEditorContentProps {
  data: NoteEditorData;
  updateField: <K extends keyof NoteEditorData>(
    field: K,
    value: NoteEditorData[K],
  ) => void;
  noteId?: string;
  blobToPathMap: MutableRefObject<Map<string, string>>;
}

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'link',
  'image',
];

export function NoteEditorContent({
  data,
  updateField,
  noteId,
  blobToPathMap,
}: NoteEditorContentProps) {
  const { upload } = useNoteUpload(noteId ?? '', 'rich-text-editor');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef(data.content);
  // eslint-disable-next-line react-hooks/refs -- intentional: keep ref in sync for stable callbacks without re-renders
  contentRef.current = data.content;

  // Revoke all blob URLs on unmount
  useEffect(() => {
    const map = blobToPathMap.current;
    return () => {
      for (const blobUrl of map.keys()) {
        URL.revokeObjectURL(blobUrl);
      }
      map.clear();
    };
  }, [blobToPathMap]);

  const handleContentChange = useCallback(
    (html: string) => {
      if (html === contentRef.current) return;
      if (isEmptyContent(html) && isEmptyContent(contentRef.current)) return;
      if (CORRUPTED_IMG.test(html) && !CORRUPTED_IMG.test(contentRef.current)) return;
      // Keep blob URLs in state — they're valid for display in Quill DOM.
      // The autosave hook's contentTransform replaces them with storage
      // paths right before sending to the server.
      updateField('content', html);
    },
    [updateField],
  );

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';

      // Show instant local preview via blob URL
      const blobUrl = URL.createObjectURL(file);
      const current = isEmptyContent(contentRef.current)
        ? ''
        : contentRef.current;
      updateField('content', current + `<p><img src="${blobUrl}" /></p>`);

      const result = await upload(file);
      if (result) {
        // Register the mapping — autosave's contentTransform will swap
        // blob URLs for storage paths before sending to the server.
        blobToPathMap.current.set(blobUrl, result.path);
        // Mark dirty so autosave fires and persists the path
        updateField('content', contentRef.current);
      }
      // Don't revoke — Quill DOM still references the blob URL for display.
      // Cleanup happens on unmount.
    },
    [upload, updateField, blobToPathMap],
  );

  const handleYouTubeEmbed = useCallback(() => {
    const url = window.prompt(
      'Enter YouTube URL',
      'https://youtube.com/watch?v=',
    );
    if (url === null || url.trim() === '') return;
    updateField('videoUrl', url.trim());
  }, [updateField]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'bullet' }],
          ['link', 'image', 'video'],
        ],
        handlers: {
          image: handleImageUpload,
          video: handleYouTubeEmbed,
        },
      },
    }),
    [handleImageUpload, handleYouTubeEmbed],
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Title row */}
      <label className="flex items-center gap-4">
        <strong className="w-16 shrink-0 text-sm font-medium text-muted-foreground">
          Title
        </strong>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Enter note title..."
          maxLength={255}
          className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </label>

      {/* Tags row */}
      <fieldset className="flex items-center gap-4">
        <legend className="sr-only">Tags</legend>
        <label
          id="tags-label"
          className="w-16 shrink-0 text-sm font-medium text-muted-foreground"
          aria-hidden="true"
        >
          Tags
        </label>
        <NoteTagsCombobox
          selectedTags={data.tags}
          onChange={(tags) => updateField('tags', tags)}
        />
      </fieldset>

      {/* Content section */}
      <fieldset className="flex min-h-0 flex-1 gap-4">
        <legend className="sr-only">Content</legend>
        <label
          id="content-label"
          className="w-16 shrink-0 self-start pt-2 text-sm font-medium text-muted-foreground"
          aria-hidden="true"
        >
          Content
        </label>
        <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-input">
          <QuillEditor
            theme="snow"
            value={data.content}
            onChange={handleContentChange}
            modules={modules}
            formats={formats}
            placeholder="Start typing your note..."
          />
        </article>
      </fieldset>

      <input
        ref={fileInputRef}
        type="file"
        accept=".webp,.jpg,.jpeg,.png"
        onChange={handleFileSelected}
        className="hidden"
        aria-hidden="true"
      />
    </section>
  );
}
