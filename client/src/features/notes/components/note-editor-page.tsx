'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { Spinner } from '@/components/primitives';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNoteEditor } from '../hooks/use-note-editor';
import { useNoteAutosave } from '../hooks/use-note-autosave';
import { NoteEditorHeader } from './note-editor-header';
import { NoteEditorContent } from './note-editor-content';
import { NoteEditorSidebar } from './note-editor-sidebar';
import { UnsavedChangesDialog } from './unsaved-changes-dialog';
import { RevertAsDraftDialog } from './revert-as-draft-dialog';
import { PublishConfirmDialog } from './publish-confirm-dialog';
import { ConflictResolutionDialog } from './conflict-resolution-dialog';
import { fetchNote } from '../api/notes-api';

const BLOB_URL_RE = /blob:https?:\/\/[^\s"]+/g;

interface NoteEditorPageProps {
  noteId?: string;
}

export function NoteEditorPage({ noteId }: NoteEditorPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const {
    data,
    isDirty,
    version,
    savedNoteId,
    setSavedNoteId,
    isLoading,
    updateField,
    markClean,
    documentUrl,
  } = useNoteEditor(noteId);

  // Check read-only access: user has READ permission but not WRITE, and is not owner
  const { data: noteDetail } = useQuery({
    queryKey: ['note', noteId],
    queryFn: () => fetchNote(noteId!),
    enabled: !!noteId,
  });

  const isOwner = noteDetail?.userId === session?.user?.id;
  const userShare = noteDetail?.shares.find((s) => s.userId === session?.user?.id);
  const isReadOnly = !isOwner && userShare?.permission === 'READ';
  const isSharedEditor = !isOwner && userShare?.permission === 'WRITE';

  // Shared map: blob URL → storage path. Populated by NoteEditorContent on
  // image upload, consumed by autosave to replace blob URLs before saving.
  const blobToPathMap = useRef<Map<string, string>>(new Map());

  const contentTransform = useCallback((content: string) => {
    const map = blobToPathMap.current;
    if (map.size === 0) return content;
    return content.replace(BLOB_URL_RE, (url) => map.get(url) ?? url);
  }, []);

  // Conflict state
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const handleConflict = useCallback(() => {
    setShowConflictDialog(true);
  }, []);

  const { status, lastSavedAt, saveNow, showLeaveDialog, confirmLeave, cancelLeave } = useNoteAutosave({
    data,
    isDirty,
    version,
    savedNoteId,
    setSavedNoteId,
    markClean,
    contentTransform,
    onConflict: handleConflict,
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
    await queryClient.invalidateQueries({ queryKey: ['notes'], refetchType: 'all' });
    setIsSaving(false);
    router.push('/notes');
  };

  const confirmSaveDraft = async () => {
    setShowDraftDialog(false);
    setIsSaving(true);
    await saveNow('draft');
    await queryClient.invalidateQueries({ queryKey: ['notes'], refetchType: 'all' });
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
    await queryClient.invalidateQueries({ queryKey: ['notes'], refetchType: 'all' });
    setIsSaving(false);
    router.push('/notes');
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveNow('published');
    await queryClient.invalidateQueries({ queryKey: ['notes'], refetchType: 'all' });
    setIsSaving(false);
    router.push(isSharedEditor ? '/shared' : '/notes');
  };

  if (isLoading) {
    return (
      <output className="flex h-full items-center justify-center" aria-busy="true">
        <Spinner size="xl" />
      </output>
    );
  }

  const handleKeepMine = async () => {
    setShowConflictDialog(false);
    // Retry save with current server version
    if (noteDetail) {
      markClean(noteDetail.version);
      setIsSaving(true);
      await saveNow();
      setIsSaving(false);
    }
  };

  const handleAcceptTheirs = () => {
    setShowConflictDialog(false);
    // Refetch the note to get server's version
    queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    window.location.reload();
  };

  return (
    <article className="flex h-full flex-col">
      {isReadOnly && (
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-6 py-2 text-sm text-amber-400">
          <Eye className="h-4 w-4" />
          View-only access — you can read this note but cannot make changes
        </div>
      )}
      {!isReadOnly && (
        <NoteEditorHeader
          title={data.title}
          isNew={!noteId}
          isPublished={data.status === 'published'}
          isSharedEditor={isSharedEditor}
          status={status}
          lastSavedAt={lastSavedAt}
          isSaving={isSaving}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onSave={handleSave}
        />
      )}

      <section className="flex flex-1 overflow-hidden">
        <section className="flex flex-1 flex-col overflow-hidden p-6">
          <NoteEditorContent data={data} updateField={isReadOnly ? (() => {}) as any : updateField} noteId={noteId ?? savedNoteId} blobToPathMap={blobToPathMap} />
        </section>

        {!isReadOnly && (
          <NoteEditorSidebar
            data={data}
            updateField={updateField}
            version={version}
            noteId={noteId ?? savedNoteId}
            documentUrl={documentUrl}
            shareCount={noteDetail?.shares.length ?? 0}
            isOwner={isOwner ?? true}
          />
        )}
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
      <ConflictResolutionDialog
        open={showConflictDialog}
        noteId={noteId ?? savedNoteId ?? ''}
        onKeepMine={handleKeepMine}
        onAcceptTheirs={handleAcceptTheirs}
        onClose={() => setShowConflictDialog(false)}
      />
    </article>
  );
}
