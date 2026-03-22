'use client';

import { useMemo } from 'react';
import { diffWords } from 'diff';
import { Paperclip, Video, Tag } from 'lucide-react';

interface VersionDiffViewProps {
  oldContent: string;
  newContent: string;
  oldTitle: string;
  newTitle: string;
  oldDocument?: string | null;
  newDocument?: string | null;
  oldDocumentSize?: number | null;
  newDocumentSize?: number | null;
  oldVideoUrl?: string | null;
  newVideoUrl?: string | null;
  oldTags?: string[];
  newTags?: string[];
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
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

export function VersionDiffView({
  oldContent,
  newContent,
  oldTitle,
  newTitle,
  oldDocument,
  newDocument,
  oldDocumentSize,
  newDocumentSize,
  oldVideoUrl,
  newVideoUrl,
  oldTags = [],
  newTags = [],
}: VersionDiffViewProps) {
  const titleDiff = useMemo(() => {
    if (oldTitle === newTitle) return null;
    return diffWords(oldTitle, newTitle);
  }, [oldTitle, newTitle]);

  const contentDiff = useMemo(() => {
    const oldText = stripHtml(oldContent || '');
    const newText = stripHtml(newContent || '');
    if (oldText === newText) return null;
    return diffWords(oldText, newText);
  }, [oldContent, newContent]);

  const documentChanged = (oldDocument ?? null) !== (newDocument ?? null) ||
    (oldDocumentSize ?? null) !== (newDocumentSize ?? null);

  const videoChanged = (oldVideoUrl ?? null) !== (newVideoUrl ?? null);

  const tagsChanged = useMemo(() => {
    const oldSet = new Set(oldTags);
    const newSet = new Set(newTags);
    if (oldSet.size !== newSet.size) return true;
    for (const tag of oldSet) {
      if (!newSet.has(tag)) return true;
    }
    return false;
  }, [oldTags, newTags]);

  const hasDifferences = titleDiff || contentDiff || documentChanged || videoChanged || tagsChanged;

  if (!hasDifferences) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-md font-semibold text-muted-foreground">
          No differences between this version and the current note
        </p>
      </div>
    );
  }

  // Compute tag diff arrays
  const removedTags = oldTags.filter((t) => !newTags.includes(t));
  const addedTags = newTags.filter((t) => !oldTags.includes(t));
  const unchangedTags = oldTags.filter((t) => newTags.includes(t));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Changes</h3>

      {titleDiff && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Title
          </p>
          <p className="text-sm leading-relaxed">
            {titleDiff.map((part, i) => {
              if (part.added) {
                return (
                  <ins
                    key={i}
                    className="bg-green-500/20 text-green-700 no-underline dark:text-green-400"
                  >
                    {part.value}
                  </ins>
                );
              }
              if (part.removed) {
                return (
                  <del
                    key={i}
                    className="bg-red-500/20 text-red-700 dark:text-red-400"
                  >
                    {part.value}
                  </del>
                );
              }
              return <span key={i}>{part.value}</span>;
            })}
          </p>
        </div>
      )}

      {contentDiff && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Content
          </p>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {contentDiff.map((part, i) => {
              if (part.added) {
                return (
                  <ins
                    key={i}
                    className="bg-green-500/20 text-green-700 no-underline dark:text-green-400"
                  >
                    {part.value}
                  </ins>
                );
              }
              if (part.removed) {
                return (
                  <del
                    key={i}
                    className="bg-red-500/20 text-red-700 dark:text-red-400"
                  >
                    {part.value}
                  </del>
                );
              }
              return <span key={i}>{part.value}</span>;
            })}
          </div>
        </div>
      )}

      {documentChanged && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" />
            Attachment
          </p>
          <div className="space-y-1 text-sm">
            {oldDocument && (
              <del className="block bg-red-500/20 text-red-700 dark:text-red-400">
                {extractFileName(oldDocument)}
                {oldDocumentSize ? ` (${formatFileSize(oldDocumentSize)})` : ''}
              </del>
            )}
            {newDocument && (
              <ins className="block bg-green-500/20 text-green-700 no-underline dark:text-green-400">
                {extractFileName(newDocument)}
                {newDocumentSize ? ` (${formatFileSize(newDocumentSize)})` : ''}
              </ins>
            )}
          </div>
        </div>
      )}

      {videoChanged && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
            <Video className="h-3.5 w-3.5" />
            Video URL
          </p>
          <div className="space-y-1 text-sm">
            {oldVideoUrl && (
              <del className="block truncate bg-red-500/20 text-red-700 dark:text-red-400">
                {oldVideoUrl}
              </del>
            )}
            {newVideoUrl && (
              <ins className="block truncate bg-green-500/20 text-green-700 no-underline dark:text-green-400">
                {newVideoUrl}
              </ins>
            )}
          </div>
        </div>
      )}

      {tagsChanged && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {removedTags.map((tag) => (
              <del
                key={`del-${tag}`}
                className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400"
              >
                {tag}
              </del>
            ))}
            {addedTags.map((tag) => (
              <ins
                key={`ins-${tag}`}
                className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-700 no-underline dark:text-green-400"
              >
                {tag}
              </ins>
            ))}
            {unchangedTags.map((tag) => (
              <span
                key={`same-${tag}`}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
