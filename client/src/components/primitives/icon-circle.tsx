import type { ReactNode } from 'react';

interface IconCircleProps {
  bgClass: string;
  children: ReactNode;
  size?: 'sm' | 'md';
}

export function IconCircle({
  bgClass,
  children,
  size = 'md',
}: IconCircleProps) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${sizeClass} ${bgClass}`}
    >
      {children}
    </span>
  );
}
