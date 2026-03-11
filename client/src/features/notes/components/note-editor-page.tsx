'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNoteEditor } from '../hooks/use-note-editor';
import { useNoteAutosave } from '../hooks/use-note-autosave';
import { NoteEditorHeader } from './note-editor-header';
import { NoteEditorContent } from './note-editor-content';
import { NoteEditorSidebar } from './note-editor-sidebar';

interface NoteEditorPageProps {
  noteId?: string;
}

export function NoteEditorPage({ noteId }: NoteEditorPageProps) {
  const {
    data,
    isDirty,
    version,
    savedNoteId,
    setSavedNoteId,
    isLoading,
    updateField,
    markClean,
  } = useNoteEditor(noteId);

  const { status, lastSavedAt, saveNow } = useNoteAutosave({
    data,
    isDirty,
    version,
    savedNoteId,
    setSavedNoteId,
    markClean,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await saveNow('draft');
    setIsSaving(false);
  };

  const handlePublish = async () => {
    setIsSaving(true);
    await saveNow('published');
    setIsSaving(false);
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
        status={status}
        lastSavedAt={lastSavedAt}
        isSaving={isSaving}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />

      <section className="flex flex-1 overflow-hidden">
        <section className="flex-1 overflow-y-auto p-6">
          <NoteEditorContent data={data} updateField={updateField} />
        </section>

        <NoteEditorSidebar
          data={data}
          updateField={updateField}
          version={version}
        />
      </section>
    </article>
  );
}
