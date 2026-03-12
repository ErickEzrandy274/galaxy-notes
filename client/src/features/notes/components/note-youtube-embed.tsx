'use client';

import { useState } from 'react';
import { Video } from 'lucide-react';
import { extractYouTubeId, getYouTubeEmbedUrl, isValidYouTubeUrl } from '../utils/youtube';

interface NoteYouTubeEmbedProps {
  videoUrl: string;
  onChange: (url: string) => void;
}

export function NoteYouTubeEmbed({ videoUrl, onChange }: NoteYouTubeEmbedProps) {
  const [error, setError] = useState('');
  const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;

  const handleBlur = () => {
    if (videoUrl && !isValidYouTubeUrl(videoUrl)) {
      setError('Invalid YouTube URL');
    } else {
      setError('');
    }
  };

  return (
    <section aria-label="YouTube embed">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        YouTube Embed
      </h3>
      <fieldset className="space-y-3">
        <label className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => {
              onChange(e.target.value);
              setError('');
            }}
            onBlur={handleBlur}
            placeholder="youtube.com/watch?v=..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {videoId && (
          <figure className="overflow-hidden rounded-lg">
            <iframe
              src={getYouTubeEmbedUrl(videoId)}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full"
            />
          </figure>
        )}
      </fieldset>
    </section>
  );
}
