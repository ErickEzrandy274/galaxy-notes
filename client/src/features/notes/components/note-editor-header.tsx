'use client';

import { DetailPageHeader, Button } from '@/components/primitives';
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
    <DetailPageHeader
      backHref={isSharedEditor ? '/shared' : '/notes'}
      backLabel={isSharedEditor ? 'Shared with Me' : 'My Notes'}
      title={isNew ? 'New Note' : title || 'Untitled'}
      actions={
        <span className="flex items-center gap-3">
          <NoteAutosaveIndicator status={status} lastSavedAt={lastSavedAt} />

          {isSharedEditor ? (
            <Button variant="primary" size="sm" loading={isSaving} onClick={onSave}>
              Save
            </Button>
          ) : isPublished ? (
            <>
              <Button variant="outline-muted" size="sm" loading={isSaving} onClick={onSaveDraft}>
                Make as Draft
              </Button>
              <Button variant="primary" size="sm" loading={isSaving} onClick={onSave}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" loading={isSaving} onClick={onSaveDraft}>
                Save as Draft
              </Button>
              <Button variant="primary" size="sm" loading={isSaving} onClick={onPublish}>
                Publish
              </Button>
            </>
          )}
        </span>
      }
    />
  );
}
