import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon: LucideIcon;
  iconColorClass: string;
  title: string;
  action?: ReactNode;
}

export function PageHeader({
  icon: Icon,
  iconColorClass,
  title,
  action,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconColorClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>
      {action}
    </header>
  );
}
