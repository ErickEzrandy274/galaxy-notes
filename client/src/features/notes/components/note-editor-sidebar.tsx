'use client';

import { NoteAttachmentUpload } from './note-attachment-upload';
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
}

export function NoteEditorSidebar({
  data,
  updateField,
  createdAt,
  version,
}: NoteEditorSidebarProps) {
  return (
    <aside className="w-72 shrink-0 space-y-6 border-l border-border p-4">
      <NoteAttachmentUpload
        photo={data.photo}
        onChange={(url) => updateField('photo', url)}
      />

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
