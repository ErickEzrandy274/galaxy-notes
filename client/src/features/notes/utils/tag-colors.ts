const TAG_COLORS = [
  'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  'bg-green-500/20 text-green-600 dark:text-green-400',
  'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  'bg-pink-500/20 text-pink-600 dark:text-pink-400',
  'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
  'bg-red-500/20 text-red-600 dark:text-red-400',
  'bg-orange-500/20 text-orange-600 dark:text-orange-400',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTagColor(tag: string): string {
  return TAG_COLORS[hashString(tag) % TAG_COLORS.length];
}
