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
  documentUrl?: string | null;
  shareCount?: number;
  isOwner?: boolean;
}

export function NoteEditorSidebar({
  data,
  updateField,
  createdAt,
  version,
  noteId,
  documentUrl,
  shareCount = 0,
  isOwner = true,
}: NoteEditorSidebarProps) {
  return (
    <aside className="w-96 shrink-0 overflow-y-auto space-y-6 border-l border-border p-4">
      <NoteAttachmentUpload
        document={data.document}
        onChange={(url, fileSize) => {
          updateField('document', url);
          updateField('documentSize', fileSize ?? null);
        }}
        noteId={noteId}
        initialDocumentUrl={documentUrl}
      />

      <NoteSharePanel
        noteId={noteId}
        noteTitle={data.title}
        noteStatus={data.status}
        shareCount={shareCount}
        isOwner={isOwner}
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
