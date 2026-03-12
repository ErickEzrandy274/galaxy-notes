'use client';

import { FileText, Globe, PenLine, Archive, Users } from 'lucide-react';
import { useNoteStats } from '../hooks/use-note-stats';
import type { NoteStats } from '../types';

interface NotesStatsProps {
  activeFilter?: string;
  onFilterChange: (status: string | undefined) => void;
}

const cards: {
  key: keyof NoteStats;
  label: string;
  icon: typeof FileText;
  color: string;
  activeBg: string;
  filterValue: string | undefined;
}[] = [
  { key: 'total', label: 'Total Notes', icon: FileText, color: 'text-violet-400', activeBg: 'bg-violet-500/10 border-violet-500/40', filterValue: undefined },
  { key: 'published', label: 'Published', icon: Globe, color: 'text-green-400', activeBg: 'bg-green-500/10 border-green-500/40', filterValue: 'published' },
  { key: 'draft', label: 'Drafts', icon: PenLine, color: 'text-amber-400', activeBg: 'bg-amber-500/10 border-amber-500/40', filterValue: 'draft' },
  { key: 'archived', label: 'Archived', icon: Archive, color: 'text-indigo-400', activeBg: 'bg-indigo-500/10 border-indigo-500/40', filterValue: 'archived' },
  { key: 'shared', label: 'Shared', icon: Users, color: 'text-sky-400', activeBg: 'bg-sky-500/10 border-sky-500/40', filterValue: 'shared' },
];

export function NotesStats({ activeFilter, onFilterChange }: NotesStatsProps) {
  const { data, isLoading } = useNoteStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-lg border border-border/50 bg-card"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-3">
      {cards.map(({ key, label, icon: Icon, color, activeBg, filterValue }) => {
        const isActive =
          filterValue === undefined ? !activeFilter : activeFilter === filterValue;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onFilterChange(filterValue)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
              isActive
                ? activeBg
                : 'border-border/50 bg-card hover:border-border hover:bg-muted/30'
            }`}
          >
            <Icon size={30} className={color} />
            <span className="flex flex-col">
              <span className="text-lg font-semibold leading-tight text-foreground">
                {data?.[key] ?? '—'}
              </span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
