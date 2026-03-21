import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  icon: ReactNode;
  iconBgClass: string;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  loadingLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  icon,
  iconBgClass,
  title,
  description,
  confirmLabel,
  loadingLabel,
  cancelLabel = 'Cancel',
  confirmClassName = 'bg-primary text-primary-foreground hover:bg-primary/90',
  isLoading,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <article className="relative z-10 w-100 rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBgClass}`}
            >
              {icon}
            </span>
            <h4 className="text-left text-lg font-semibold text-foreground">
              {title}
            </h4>
          </div>
          <div>
            <p className="mt-1 text-left text-sm text-muted-foreground">
              {description}
            </p>
            {children}
          </div>
        </div>
        <footer className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${confirmClassName}`}
          >
            {isLoading && loadingLabel ? loadingLabel : confirmLabel}
          </button>
        </footer>
      </article>
    </div>
  );
}
