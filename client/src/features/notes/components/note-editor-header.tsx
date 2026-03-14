'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { NoteAutosaveIndicator } from './note-autosave-indicator';
import type { AutosaveStatus } from '../types';

interface NoteEditorHeaderProps {
  title: string;
  isNew: boolean;
  isPublished: boolean;
  isSharedEditor?: boolean;
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  isSaving: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onSave: () => void;
}

export function NoteEditorHeader({
  title,
  isNew,
  isPublished,
  isSharedEditor = false,
  status,
  lastSavedAt,
  isSaving,
  onSaveDraft,
  onPublish,
  onSave,
}: NoteEditorHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <Link
          href={isSharedEditor ? '/shared' : '/notes'}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {isSharedEditor ? 'Shared with Me' : 'My Notes'}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">
          {isNew ? 'New Note' : title || 'Untitled'}
        </span>
      </nav>

      <span className="flex items-center gap-3">
        <NoteAutosaveIndicator status={status} lastSavedAt={lastSavedAt} />

        {isSharedEditor ? (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 cursor-pointer"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </button>
        ) : isPublished ? (
          <>
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 cursor-pointer"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Make as Draft
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 cursor-pointer"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 cursor-pointer"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save as Draft
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 cursor-pointer"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Publish
            </button>
          </>
        )}
      </span>
    </header>
  );
}
