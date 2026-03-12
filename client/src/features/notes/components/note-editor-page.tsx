'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useNoteEditor } from '../hooks/use-note-editor';
import { useNoteAutosave } from '../hooks/use-note-autosave';
import { NoteEditorHeader } from './note-editor-header';
import { NoteEditorContent } from './note-editor-content';
import { NoteEditorSidebar } from './note-editor-sidebar';
import { UnsavedChangesDialog } from './unsaved-changes-dialog';
import { RevertAsDraftDialog } from './revert-as-draft-dialog';
import { PublishConfirmDialog } from './publish-confirm-dialog';

const BLOB_URL_RE = /blob:https?:\/\/[^\s"]+/g;

interface NoteEditorPageProps {
  noteId?: string;
}

export function NoteEditorPage({ noteId }: NoteEditorPageProps) {
  const router = useRouter();
  const {
    data,
    isDirty,
    version,
    savedNoteId,
    setSavedNoteId,
    isLoading,
    updateField,
    markClean,
    photoUrl,
  } = useNoteEditor(noteId);

  // Shared map: blob URL → storage path. Populated by NoteEditorContent on
  // image upload, consumed by autosave to replace blob URLs before saving.
  const blobToPathMap = useRef<Map<string, string>>(new Map());

  const contentTransform = useCallback((content: string) => {
    const map = blobToPathMap.current;
    if (map.size === 0) return content;
    return content.replace(BLOB_URL_RE, (url) => map.get(url) ?? url);
  }, []);

  const { status, lastSavedAt, saveNow, showLeaveDialog, confirmLeave, cancelLeave } = useNoteAutosave({
    data,
    isDirty,
    version,
    savedNoteId,
    setSavedNoteId,
    markClean,
    contentTransform,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const isPublished = data.status === 'published';

  const handleSaveDraft = async () => {
    if (isPublished) {
      setShowDraftDialog(true);
      return;
    }
    setIsSaving(true);
    await saveNow('draft');
    setIsSaving(false);
    router.push('/notes');
  };

  const confirmSaveDraft = async () => {
    setShowDraftDialog(false);
    setIsSaving(true);
    await saveNow('draft');
    setIsSaving(false);
    router.push('/notes');
  };

  const handlePublish = () => {
    setShowPublishDialog(true);
  };

  const confirmPublish = async () => {
    setShowPublishDialog(false);
    setIsSaving(true);
    await saveNow('published');
    setIsSaving(false);
    router.push('/notes');
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveNow('published');
    setIsSaving(false);
    router.push('/notes');
  };

  if (isLoading) {
    return (
      <output className="flex h-full items-center justify-center" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </output>
    );
  }

  return (
    <article className="flex h-full flex-col">
      <NoteEditorHeader
        title={data.title}
        isNew={!noteId}
        isPublished={data.status === 'published'}
        status={status}
        lastSavedAt={lastSavedAt}
        isSaving={isSaving}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onSave={handleSave}
      />

      <section className="flex flex-1 overflow-hidden">
        <section className="flex flex-1 flex-col overflow-hidden p-6">
          <NoteEditorContent data={data} updateField={updateField} noteId={noteId ?? savedNoteId} blobToPathMap={blobToPathMap} />
        </section>

        <NoteEditorSidebar
          data={data}
          updateField={updateField}
          version={version}
          noteId={noteId ?? savedNoteId}
          photoUrl={photoUrl}
        />
      </section>
      <UnsavedChangesDialog
        open={showLeaveDialog}
        onLeave={confirmLeave}
        onStay={cancelLeave}
      />
      <RevertAsDraftDialog
        open={showDraftDialog}
        onConfirm={confirmSaveDraft}
        onCancel={() => setShowDraftDialog(false)}
      />
      <PublishConfirmDialog
        open={showPublishDialog}
        onConfirm={confirmPublish}
        onCancel={() => setShowPublishDialog(false)}
      />
    </article>
  );
}
