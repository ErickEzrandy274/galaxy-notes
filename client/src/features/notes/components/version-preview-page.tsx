'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Paperclip, FileText, Eye, Video, AlertTriangle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { fetchVersionDetail } from '../api/notes-api';
import { VersionPreviewBanner } from './version-preview-banner';
import { VersionDiffView } from './version-diff-view';
import { TagList } from './tag-badge';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../utils/youtube';

interface VersionPreviewPageProps {
  noteId: string;
  versionId: string;
  onBackToCurrent: () => void;
}

function extractFileName(storagePath: string | null | undefined): string {
  if (!storagePath) return '';
  return decodeURIComponent(
    storagePath.split('?')[0].split('/').pop()?.replace(/^\d+_/, '') ?? 'attachment',
  );
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VersionPreviewPage({
  noteId,
  versionId,
  onBackToCurrent,
}: VersionPreviewPageProps) {
  const { data: version, isLoading } = useQuery({
    queryKey: ['note-version', noteId, versionId],
    queryFn: () => fetchVersionDetail(noteId, versionId),
  });

  if (isLoading || !version) {
    return (
      <output className="flex h-full items-center justify-center" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </output>
    );
  }

  const sanitizedContent = version.content
    ? DOMPurify.sanitize(version.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'pre', 'code', 'span', 'sub', 'sup'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class', 'style'],
      })
    : '';

  const versionFileName = extractFileName(version.document);
  const versionFileSize = formatFileSize(version.documentSize);
  const versionVideoId = version.videoUrl ? extractYouTubeId(version.videoUrl) : null;

  return (
    <div className="flex h-full flex-col">
      <VersionPreviewBanner
        noteId={noteId}
        versionId={versionId}
        versionNumber={version.version}
        createdAt={version.createdAt}
        changedByName={version.changedByName}
        noteStatus={version.noteStatus}
        onBackToCurrent={onBackToCurrent}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Diff view */}
        <section className="mb-8">
          <VersionDiffView
            oldContent={version.content}
            newContent={version.currentContent || ''}
            oldTitle={version.title}
            newTitle={version.currentTitle}
            oldDocument={version.document}
            newDocument={version.currentDocument}
            oldDocumentSize={version.documentSize}
            newDocumentSize={version.currentDocumentSize}
            oldVideoUrl={version.videoUrl}
            newVideoUrl={version.currentVideoUrl}
            oldTags={version.tags}
            newTags={version.currentTags}
          />
        </section>

        {/* Full version content */}
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Version {version.version} Content
          </h3>

          <h1 className="wrap-break-word text-2xl font-bold text-foreground">
            {version.title || 'Untitled'}
          </h1>

          {version.tags.length > 0 && (
            <div className="mt-4">
              <TagList tags={version.tags} max={9} />
            </div>
          )}

          {version.content && (
            <div
              className="note-view-content mt-4 max-w-none text-foreground [&_p:empty]:min-h-[1.5em] [&_p:has(br:only-child)]:min-h-[1.5em]"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          )}

          {version.document && (
            <div className="mt-6">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Paperclip className="h-4 w-4" />
                Attachment
              </h4>
              <figure className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-foreground" title={versionFileName}>
                    {versionFileName}
                  </span>
                  {versionFileSize && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ({versionFileSize})
                    </span>
                  )}
                </span>
                {version.documentUrl ? (
                  <a
                    href={version.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Preview attachment"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    File {versionFileName} not available
                  </span>
                )}
              </figure>
            </div>
          )}

          {versionVideoId && (
            <div className="mt-6">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Video className="h-4 w-4" />
                Supporting Video
              </h4>
              <figure className="overflow-hidden rounded-lg">
                <iframe
                  src={getYouTubeEmbedUrl(versionVideoId)}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </figure>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
