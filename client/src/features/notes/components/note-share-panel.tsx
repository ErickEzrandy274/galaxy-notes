'use client';

import { Users, Settings } from 'lucide-react';
import { useState } from 'react';
import type { NoteStatus } from '../types';
import { ShareModal } from './share-modal';

interface NoteSharePanelProps {
  noteId?: string;
  noteTitle: string;
  noteStatus: NoteStatus;
  shareCount: number;
  isOwner: boolean;
}

export function NoteSharePanel({ noteId, noteTitle, noteStatus, shareCount, isOwner }: NoteSharePanelProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const isPublished = noteStatus === 'published' || noteStatus === 'shared';

  return (
    <section aria-label="Sharing">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Sharing</h3>
      {!isPublished && (
        <p className="mb-2 text-sm text-muted-foreground">
          Publish note first to enable sharing
        </p>
      )}
      {isPublished && (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border bg-input px-3 py-2">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {shareCount > 0 ? `${shareCount} collaborator${shareCount > 1 ? 's' : ''}` : 'No collaborators'}
            </span>
            {isOwner && noteId && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
              >
                <Settings className="h-3 w-3" />
                Manage
              </button>
            )}
          </div>
        </div>
      )}
      {isOwner && noteId && (
        <ShareModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          noteId={noteId}
          noteTitle={noteTitle}
        />
      )}
    </section>
  );
}
