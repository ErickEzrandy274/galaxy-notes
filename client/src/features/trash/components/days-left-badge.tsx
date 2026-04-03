interface DaysLeftBadgeProps {
  deletedAt: string;
  retentionDays: number;
}

export function DaysLeftBadge({ deletedAt, retentionDays }: DaysLeftBadgeProps) {
  const deletedDate = new Date(deletedAt);
  const now = new Date();
  const elapsed = Math.floor(
    (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysLeft = retentionDays - elapsed;

  if (daysLeft <= 0) {
    return (
      <span className="inline-flex rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
        expired
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
      {daysLeft}d left
    </span>
  );
}
