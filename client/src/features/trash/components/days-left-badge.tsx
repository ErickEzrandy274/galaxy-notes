import { Badge } from '@/components/shared/badge';

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
    return <Badge className="bg-red-500/20 text-red-400">expired</Badge>;
  }

  return (
    <Badge className="bg-green-500/20 text-green-400">{daysLeft}d left</Badge>
  );
}
