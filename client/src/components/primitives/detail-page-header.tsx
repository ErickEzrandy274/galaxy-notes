import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface DetailPageHeaderProps {
  backHref: string;
  backLabel: string;
  title: string;
  titleSuffix?: ReactNode;
  actions?: ReactNode;
}

export function DetailPageHeader({
  backHref,
  backLabel,
  title,
  titleSuffix,
  actions,
}: DetailPageHeaderProps) {
  return (
    <header className="flex flex-col gap-2 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <Link
          href={backHref}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="truncate font-medium text-foreground">{title}</span>
        {titleSuffix}
      </nav>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
