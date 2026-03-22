'use client';

import { useState } from 'react';
import DOMPurify from 'dompurify';
import { Download, Eye, FileText, Paperclip, Video } from 'lucide-react';
import type { NoteDetail } from '../types';
import { StatusBadge } from './status-badge';
import { TagList } from './tag-badge';
import { formatDateTime } from '../utils/format-date';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../utils/youtube';
import { ImageLightbox } from './image-lightbox';

interface NoteDetailContentProps {
  note: NoteDetail;
}

export function NoteDetailContent({ note }: NoteDetailContentProps) {
  const videoId = note.videoUrl ? extractYouTubeId(note.videoUrl) : null;
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const sanitizedContent = note.content
    ? DOMPurify.sanitize(note.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'pre', 'code', 'span', 'sub', 'sup'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class', 'style'],
      })
    : '';

  const fileName = note.document
    ? decodeURIComponent(
        note.document.split('?')[0].split('/').pop()?.replace(/^\d+_/, '') ?? 'attachment',
      )
    : null;

  const hasSidebar = note.document || videoId;

  return (
    <section className="flex flex-1 flex-col overflow-hidden md:flex-row">
      {/* Left: Main content */}
      <section className={`flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 ${!hasSidebar ? 'pb-20 md:pb-6' : ''}`}>
        <h1 className="wrap-break-word text-2xl font-bold text-foreground">
          {note.title || 'Untitled'}
        </h1>

        <section className="mt-3 flex items-center gap-3">
          <StatusBadge status={note.status} />
          <span className="text-sm text-muted-foreground">
            Last edited: {formatDateTime(note.updatedAt)}
          </span>
        </section>

        {note.tags.length > 0 && (
          <section className="mt-4">
            <h2 className="text-lg font-semibold text-foreground">Tags</h2>
            <TagList tags={note.tags} max={9} />
          </section>
        )}

        {note.content && (
          <article
            className="note-view-content mt-6 max-w-none text-foreground [&_p:empty]:min-h-[1.5em] [&_p:has(br:only-child)]:min-h-[1.5em]"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName === 'IMG') {
                setLightboxSrc((target as HTMLImageElement).src);
              }
            }}
          />
        )}

        <ImageLightbox
          open={lightboxSrc !== null}
          src={lightboxSrc ?? ''}
          alt="Full size preview"
          onClose={() => setLightboxSrc(null)}
        />
      </section>

      {/* Right: Sidebar with attachment & video */}
      {hasSidebar && (
        <aside className="shrink-0 space-y-6 overflow-y-auto border-t border-border p-4 pb-20 md:w-96 md:border-l md:border-t-0 md:pb-4">
          {note.document && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Paperclip className="h-4 w-4" />
                Attachment
              </h2>
              <figure className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-foreground" title={fileName ?? undefined}>
                    {fileName}
                  </span>
                </span>
                {note.documentUrl && (
                  <span className="flex shrink-0 items-center gap-1">
                    <a
                      href={note.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Preview attachment"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(note.documentUrl!);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName ?? 'attachment.pdf';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Download attachment"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </span>
                )}
              </figure>
            </section>
          )}

          {videoId && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Video className="h-5 w-5" />
                Supporting Video
              </h2>
              <figure className="overflow-hidden rounded-lg">
                <iframe
                  src={getYouTubeEmbedUrl(videoId)}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </figure>
            </section>
          )}
        </aside>
      )}
    </section>
  );
}
