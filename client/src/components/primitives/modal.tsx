import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  children: ReactNode;
  width?: string;
}

export function Modal({ open, children, width = 'w-100' }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <article
        className={`relative z-10 rounded-lg border border-border bg-card p-6 shadow-xl ${width}`}
      >
        {children}
      </article>
    </div>
  );
}
