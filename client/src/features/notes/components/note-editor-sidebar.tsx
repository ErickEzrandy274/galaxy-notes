'use client';

import { NoteAttachmentUpload } from './note-attachment-upload';
import { NoteSharePanel } from './note-share-panel';
import { NoteYouTubeEmbed } from './note-youtube-embed';
import { NoteInfoPanel } from './note-info-panel';
import type { NoteEditorData } from '../types';

interface NoteEditorSidebarProps {
  data: NoteEditorData;
  updateField: <K extends keyof NoteEditorData>(
    field: K,
    value: NoteEditorData[K],
  ) => void;
  createdAt?: string;
  version: number;
  noteId?: string;
  photoUrl?: string | null;
}

export function NoteEditorSidebar({
  data,
  updateField,
  createdAt,
  version,
  noteId,
  photoUrl,
}: NoteEditorSidebarProps) {
  return (
    <aside className="w-96 shrink-0 overflow-y-auto space-y-6 border-l border-border p-4">
      <NoteAttachmentUpload
        photo={data.photo}
        onChange={(url) => updateField('photo', url)}
        noteId={noteId}
        initialPhotoUrl={photoUrl}
      />

      <NoteSharePanel noteStatus={data.status} />

      <NoteInfoPanel
        content={data.content}
        createdAt={createdAt}
        version={version}
      />

      <NoteYouTubeEmbed
        videoUrl={data.videoUrl}
        onChange={(url) => updateField('videoUrl', url)}
      />
    </aside>
  );
}
