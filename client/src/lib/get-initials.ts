export function getInitials(name: string | null | undefined): string {
  return (
    name
      ?.split(/\s+/)
      .slice(0, 3)
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase() || 'U'
  );
}
