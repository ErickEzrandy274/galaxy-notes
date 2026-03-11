import { getTagColor } from '../utils/tag-colors';

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(tag)}`}
    >
      #{tag}
    </span>
  );
}

export function TagList({ tags, max = 3 }: { tags: string[]; max?: number }) {
  const visible = tags.slice(0, max);
  const overflow = tags.length - max;

  return (
    <ul className="flex flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <li key={tag}><TagBadge tag={tag} /></li>
      ))}
      {overflow > 0 && (
        <li className="text-xs text-muted-foreground">+{overflow}</li>
      )}
    </ul>
  );
}
