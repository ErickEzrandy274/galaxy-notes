import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <figure
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"
        aria-hidden="true"
      >
        <Icon size={32} className="text-muted-foreground" />
      </figure>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </section>
  );
}
